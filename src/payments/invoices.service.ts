import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Like, Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { pageWindow, toPage } from 'common/pagination';
import { businessDateOf } from 'common/utils/business-date';
import { whereDayRange } from 'common/utils/date-range';
import { dailyNumberPrefix, nextDailyNumber } from 'common/utils/daily-number';
import { containsPattern } from 'common/utils/like-pattern';
import { retryOnUniqueViolation } from 'common/utils/unique-retry';
import { Visit } from 'src/queue/entities/visit.entity';
import { ChargeGroup, groupCharges } from './charge-groups';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { VisitCharge } from './entities/visit-charge.entity';
import { ChargeStatus } from './enums/charge.enum';
import { InvoiceStatus } from './enums/payment.enum';
import { settle } from './invoice-balance';

const INVOICE_CODE = 'INV';

export interface InvoiceDetails {
  invoice: Invoice;
  groups: ChargeGroup<VisitCharge>[];
  payments: Payment[];
  total: number;
  paid: number;
  balance: number;
}

@Injectable()
export class InvoicesService extends BaseCrudService<Invoice> {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    @InjectRepository(VisitCharge)
    private readonly charges: Repository<VisitCharge>,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
  ) {
    super(invoices);
  }

  async syncForVisit(visitId: string): Promise<Invoice> {
    const invoice = await this.ensureForVisit(visitId);
    return this.invoices.manager.transaction((manager) =>
      this.refresh(manager, invoice.id),
    );
  }

  async forVisit(visitId: string): Promise<InvoiceDetails> {
    const invoice = await this.syncForVisit(visitId);
    return this.details(invoice.id);
  }

  async details(id: string): Promise<InvoiceDetails> {
    const invoice = await this.invoices.findOne({
      where: { id },
      relations: { patient: true, visit: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    const [charges, payments] = await Promise.all([
      this.charges.find({
        where: { visitId: invoice.visitId },
        order: { createdAt: 'ASC' },
      }),
      this.payments.find({
        where: { invoiceId: id },
        relations: { receivedBy: true, voidedBy: true },
        order: { receivedAt: 'ASC' },
      }),
    ]);
    const { total, paid, balance } = settle(charges, payments);
    return {
      invoice,
      groups: groupCharges(charges),
      payments,
      total,
      paid,
      balance,
    };
  }

  async search(query: QueryInvoicesDto): Promise<IPagination<Invoice>> {
    const window = pageWindow(query);
    const sortOrder = query.sortOrder ?? 'DESC';
    const qb = this.invoices
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.patient', 'patient');
    if (query.status?.length) {
      qb.andWhere('invoice.status IN (:...statuses)', {
        statuses: query.status,
      });
    }
    if (query.search?.trim()) {
      qb.andWhere(
        `(invoice.number ILIKE :term OR patient.mrn ILIKE :term OR patient.firstName ILIKE :term OR patient.lastName ILIKE :term)`,
        { term: containsPattern(query.search.trim()) },
      );
    }
    whereDayRange(qb, 'invoice.createdAt', query);
    qb.orderBy('invoice.createdAt', sortOrder)
      .addOrderBy('invoice.id', sortOrder)
      .skip(window.skip)
      .take(window.take);
    const [items, total] = await qb.getManyAndCount();
    return toPage(items, total, window);
  }

  async refresh(manager: EntityManager, invoiceId: string): Promise<Invoice> {
    const invoice = await manager.findOneOrFail(Invoice, {
      where: { id: invoiceId },
    });
    const charges = await manager.find(VisitCharge, {
      where: { visitId: invoice.visitId },
    });
    const payments = await manager.find(Payment, { where: { invoiceId } });
    const { total, paid, status } = settle(charges, payments);
    invoice.total = total;
    invoice.paid = paid;
    invoice.status = status;
    invoice.settledAt =
      status === InvoiceStatus.PAID ? (invoice.settledAt ?? new Date()) : null;
    await manager.save(invoice);
    await manager.update(
      VisitCharge,
      {
        visitId: invoice.visitId,
        status:
          status === InvoiceStatus.PAID
            ? ChargeStatus.PENDING
            : ChargeStatus.PAID,
      },
      {
        status:
          status === InvoiceStatus.PAID
            ? ChargeStatus.PAID
            : ChargeStatus.PENDING,
      },
    );
    return invoice;
  }

  private async ensureForVisit(visitId: string): Promise<Invoice> {
    const existing = await this.invoices.findOne({ where: { visitId } });
    if (existing) return existing;
    const visit = await this.visits.findOne({
      where: { id: visitId },
      select: { id: true, patientId: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    return retryOnUniqueViolation(async () => {
      const raced = await this.invoices.findOne({ where: { visitId } });
      if (raced) return raced;
      return this.invoices.save(
        this.invoices.create({
          visitId,
          patientId: visit.patientId,
          number: await this.nextNumber(),
        }),
      );
    });
  }

  private async nextNumber(): Promise<string> {
    const today = businessDateOf(new Date());
    const last = await this.invoices.findOne({
      where: { number: Like(`${dailyNumberPrefix(INVOICE_CODE, today)}%`) },
      order: { number: 'DESC' },
      withDeleted: true,
    });
    return nextDailyNumber(INVOICE_CODE, today, last?.number ?? null);
  }
}
