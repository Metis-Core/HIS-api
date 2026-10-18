import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { LabOrder } from 'src/lab/entities/lab-order.entity';
import { OrderStatus } from 'src/orders/enums/order-status.enum';
import { ProcedureOrder } from 'src/orders/entities/procedure-order.entity';
import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { Invoice } from 'src/payments/entities/invoice.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { VisitCharge } from 'src/payments/entities/visit-charge.entity';
import { renderDischargeSummary } from './templates/discharge.template';
import { renderProcedureReport } from './templates/procedure-report.template';
import { renderPrescription } from './templates/prescription.template';
import { renderVisitReceipt } from './templates/visit-receipt.template';
import { renderHtml } from './render-html';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(LabOrder)
    private readonly labOrders: Repository<LabOrder>,
    @InjectRepository(Prescription)
    private readonly prescriptions: Repository<Prescription>,
    @InjectRepository(Consultation)
    private readonly consultations: Repository<Consultation>,
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
    @InjectRepository(VisitCharge)
    private readonly charges: Repository<VisitCharge>,
    @InjectRepository(ProcedureOrder)
    private readonly procedureOrders: Repository<ProcedureOrder>,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
  ) {}

  async renderPrescription(id: string, autoPrint = false): Promise<string> {
    const prescription = await this.prescriptions.findOne({
      where: { id },
      relations: { items: { item: true }, patient: true, prescribedBy: true },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');
    return renderHtml(renderPrescription(prescription), { autoPrint });
  }

  async renderDischargeSummary(
    consultationId: string,
    autoPrint = false,
  ): Promise<string> {
    const consultation = await this.consultations.findOne({
      where: { id: consultationId },
      relations: { patient: true, doctor: true, diagnoses: true },
    });
    if (!consultation) throw new NotFoundException('Consultation not found');

    const labOrders = await this.labOrders.find({
      where: { consultationId },
      relations: { items: { test: true } },
    });
    const prescriptions = await this.prescriptions.find({
      where: { consultationId },
      relations: { items: { item: true } },
    });

    return renderHtml(
      renderDischargeSummary({ consultation, labOrders, prescriptions }),
      { autoPrint },
    );
  }

  async renderVisitReceipt(
    visitId: string,
    autoPrint = false,
  ): Promise<string> {
    const visit = await this.visits.findOne({
      where: { id: visitId },
      relations: { patient: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');

    const consultations = await this.consultations.find({
      where: { visitId },
      select: { id: true },
    });
    const charges = await this.charges.find({
      where: { visitId },
      order: { createdAt: 'ASC' },
    });
    const invoice = await this.invoices.findOne({ where: { visitId } });
    const payments = invoice
      ? await this.payments.find({
          where: { invoiceId: invoice.id },
          order: { receivedAt: 'ASC' },
        })
      : [];
    const consultationIds = consultations.map((c) => c.id);
    const prescriptions = consultationIds.length
      ? await this.prescriptions
          .createQueryBuilder('p')
          .leftJoinAndSelect('p.items', 'items')
          .leftJoinAndSelect('items.item', 'inv')
          .where('p.consultationId IN (:...ids)', { ids: consultationIds })
          .getMany()
      : [];

    return renderHtml(
      renderVisitReceipt({ visit, invoice, charges, payments, prescriptions }),
      { autoPrint },
    );
  }

  async renderProcedureReport(id: string, autoPrint = false): Promise<string> {
    const order = await this.procedureOrders.findOne({
      where: { id },
      relations: {
        patient: true,
        test: true,
        orderedBy: true,
        performedBy: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'The report is available once the order is completed',
      );
    }
    return renderHtml(renderProcedureReport(order), { autoPrint });
  }
}
