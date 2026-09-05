import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import mjml2html from 'mjml';
import { Repository } from 'typeorm';
import { Consultation } from 'src/consultation/entities/consultation.entity';
import { LabOrder } from 'src/lab/entities/lab-order.entity';
import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import { Visit } from 'src/queue/entities/visit.entity';
import { renderDischargeSummary } from './templates/discharge.template';
import { renderLabOrderReport } from './templates/lab-order.template';
import { renderPrescription } from './templates/prescription.template';
import { renderVisitReceipt } from './templates/visit-receipt.template';
import { printAutoTriggerScript } from './templates/shared';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(LabOrder)
    private readonly labOrders: Repository<LabOrder>,
    @InjectRepository(Prescription)
    private readonly prescriptions: Repository<Prescription>,
    @InjectRepository(Consultation)
    private readonly consultations: Repository<Consultation>,
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
  ) {}

  private async toHtml(mjml: string, opts: { autoPrint?: boolean } = {}): Promise<string> {
    const result = await mjml2html(mjml, { validationLevel: 'soft', keepComments: false });
    if (result.errors && result.errors.length > 0) {
      this.logger.warn(`MJML validation warnings: ${result.errors.map((e) => e.formattedMessage).join('; ')}`);
    }
    if (opts.autoPrint) {
      return result.html.replace('</body>', `${printAutoTriggerScript()}</body>`);
    }
    return result.html;
  }

  async renderLabOrder(id: string, autoPrint = false): Promise<string> {
    const order = await this.labOrders.findOne({
      where: { id },
      relations: { items: { test: true }, patient: true, orderedBy: true },
    });
    if (!order) throw new NotFoundException('Lab order not found');
    return this.toHtml(renderLabOrderReport(order), { autoPrint });
  }

  async renderPrescription(id: string, autoPrint = false): Promise<string> {
    const prescription = await this.prescriptions.findOne({
      where: { id },
      relations: { items: { item: true }, patient: true, prescribedBy: true },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');
    return this.toHtml(renderPrescription(prescription), { autoPrint });
  }

  async renderDischargeSummary(consultationId: string, autoPrint = false): Promise<string> {
    const consultation = await this.consultations.findOne({
      where: { id: consultationId },
      relations: { patient: true, doctor: true },
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

    return this.toHtml(
      renderDischargeSummary({ consultation, labOrders, prescriptions }),
      { autoPrint },
    );
  }

  async renderVisitReceipt(visitId: string, autoPrint = false): Promise<string> {
    const visit = await this.visits.findOne({
      where: { id: visitId },
      relations: { patient: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');

    const consultations = await this.consultations.find({
      where: { visitId },
      relations: { patient: true, doctor: true },
    });
    const labOrders = await this.labOrders.find({
      where: { visitId },
      relations: { items: { test: true } },
    });
    // Prescriptions link by consultation, not visit — collect via consultation IDs.
    const consultationIds = consultations.map((c) => c.id);
    const prescriptions = consultationIds.length
      ? await this.prescriptions
          .createQueryBuilder('p')
          .leftJoinAndSelect('p.items', 'items')
          .leftJoinAndSelect('items.item', 'inv')
          .where('p.consultationId IN (:...ids)', { ids: consultationIds })
          .getMany()
      : [];

    return this.toHtml(
      renderVisitReceipt({ visit, consultations, labOrders, prescriptions }),
      { autoPrint },
    );
  }
}
