import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { IPagination } from 'common/response-format';
import { pageWindow, toPage } from 'common/pagination';
import { businessDateOf } from 'common/utils/business-date';
import { whereDayRange } from 'common/utils/date-range';
import { dailyNumberPrefix, nextDailyNumber } from 'common/utils/daily-number';
import { retryOnUniqueViolation } from 'common/utils/unique-retry';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { VoidPaymentDto } from './dto/void-payment.dto';
import { DayClosing } from './entities/day-closing.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { REFERENCE_REQUIRED, PaymentStatus } from './enums/payment.enum';
import { InvoicesService } from './invoices.service';
import { settle } from './invoice-balance';
import { VisitCharge } from './entities/visit-charge.entity';

const RECEIPT_CODE = 'RCP';

@Injectable()
export class PaymentLedgerService extends BaseCrudService<Payment> {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly invoices: InvoicesService,
  ) {
    super(payments);
  }

  async record(dto: CreatePaymentDto, receivedById: string): Promise<Payment> {
    if (REFERENCE_REQUIRED.includes(dto.method) && !dto.reference?.trim()) {
      throw new BadRequestException(
        'Enter the transaction or claim reference for this payment method',
      );
    }
    const saved = await retryOnUniqueViolation(() =>
      this.dataSource.transaction(async (manager) => {
        const invoice = await manager.findOne(Invoice, {
          where: { id: dto.invoiceId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!invoice) throw new NotFoundException('Invoice not found');
        const now = new Date();
        const businessDate = businessDateOf(now);
        await this.assertDayOpen(
          manager.getRepository(DayClosing),
          businessDate,
        );
        const charges = await manager.find(VisitCharge, {
          where: { visitId: invoice.visitId },
        });
        const existing = await manager.find(Payment, {
          where: { invoiceId: invoice.id },
        });
        const { balance } = settle(charges, existing);
        if (balance <= 0) {
          throw new ConflictException('This invoice has nothing left to pay');
        }
        if (dto.amount > balance) {
          throw new BadRequestException(
            `The amount is more than the balance of UGX ${balance.toLocaleString()}`,
          );
        }
        const payment = await manager.save(
          manager.create(Payment, {
            invoiceId: invoice.id,
            amount: dto.amount,
            method: dto.method,
            reference: dto.reference?.trim() || null,
            receivedById,
            receivedAt: now,
            businessDate,
            receiptNumber: await this.nextReceiptNumber(
              manager.getRepository(Payment),
              businessDate,
            ),
          }),
        );
        await this.invoices.refresh(manager, invoice.id);
        return payment;
      }),
    );
    return this.details(saved.id);
  }

  async void(
    id: string,
    dto: VoidPaymentDto,
    voidedById: string,
  ): Promise<Payment> {
    await this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!payment) throw new NotFoundException('Payment not found');
      if (payment.status === PaymentStatus.VOIDED) {
        throw new ConflictException('This payment is already voided');
      }
      if (payment.closingId) {
        throw new ConflictException(
          'This payment belongs to a closed day and can no longer be voided',
        );
      }
      payment.status = PaymentStatus.VOIDED;
      payment.voidedById = voidedById;
      payment.voidedAt = new Date();
      payment.voidReason = dto.reason.trim();
      await manager.save(payment);
      await this.invoices.refresh(manager, payment.invoiceId);
    });
    return this.details(id);
  }

  async details(id: string): Promise<Payment> {
    const payment = await this.payments.findOne({
      where: { id },
      relations: {
        invoice: { patient: true, visit: true },
        receivedBy: true,
        voidedBy: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async search(query: QueryPaymentsDto): Promise<IPagination<Payment>> {
    const window = pageWindow(query);
    const sortOrder = query.sortOrder ?? 'DESC';
    const qb = this.payments
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.invoice', 'invoice')
      .leftJoinAndSelect('invoice.patient', 'patient')
      .leftJoinAndSelect('payment.receivedBy', 'receivedBy');
    if (query.method)
      qb.andWhere('payment.method = :method', { method: query.method });
    if (query.status)
      qb.andWhere('payment.status = :status', { status: query.status });
    if (query.receivedById) {
      qb.andWhere('payment.receivedById = :receivedById', {
        receivedById: query.receivedById,
      });
    }
    if (query.invoiceId) {
      qb.andWhere('payment.invoiceId = :invoiceId', {
        invoiceId: query.invoiceId,
      });
    }
    whereDayRange(qb, 'payment.businessDate', query);
    qb.orderBy('payment.receivedAt', sortOrder)
      .addOrderBy('payment.id', sortOrder)
      .skip(window.skip)
      .take(window.take);
    const [items, total] = await qb.getManyAndCount();
    return toPage(items, total, window);
  }

  private async assertDayOpen(
    closings: Repository<DayClosing>,
    businessDate: string,
  ): Promise<void> {
    if (await closings.exists({ where: { businessDate } })) {
      throw new ConflictException(
        'Today has already been closed out; ask an administrator to reopen the day',
      );
    }
  }

  private async nextReceiptNumber(
    payments: Repository<Payment>,
    businessDate: string,
  ): Promise<string> {
    const last = await payments.findOne({
      where: {
        receiptNumber: Like(
          `${dailyNumberPrefix(RECEIPT_CODE, businessDate)}%`,
        ),
      },
      order: { receiptNumber: 'DESC' },
      withDeleted: true,
    });
    return nextDailyNumber(
      RECEIPT_CODE,
      businessDate,
      last?.receiptNumber ?? null,
    );
  }
}
