import { Injectable } from '@nestjs/common';
import { LabOrder } from 'src/lab/entities/lab-order.entity';
import { LabOrdersService } from 'src/lab/lab-orders.service';
import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';
import { ConsultationActor } from './consultation-access.policy';
import { assertOpenForEditing } from './consultation-lock.policy';
import { ConsultationService } from './consultation.service';
import {
  CreateConsultationLabOrderDTO,
  CreateConsultationPrescriptionDTO,
} from './dto/consultation-orders.dto';
import { Consultation } from './entities/consultation.entity';

/** Lab orders and prescriptions raised by the doctor from an open consultation. */
@Injectable()
export class ConsultationOrdersService {
  constructor(
    private readonly consultations: ConsultationService,
    private readonly labOrders: LabOrdersService,
    private readonly pharmacy: PharmacyService,
  ) {}

  async orderLabs(
    id: string,
    dto: CreateConsultationLabOrderDTO,
    actor: ConsultationActor,
  ): Promise<LabOrder> {
    const consultation = await this.openFor(id, actor);
    return this.labOrders.createOrder(
      { ...dto, ...this.links(consultation) },
      actor.id,
    );
  }

  // Passing the visit queues the patient at the pharmacy (C5).
  async prescribe(
    id: string,
    dto: CreateConsultationPrescriptionDTO,
    actor: ConsultationActor,
  ): Promise<Prescription> {
    const consultation = await this.openFor(id, actor);
    return this.pharmacy.createPrescription(
      { ...dto, ...this.links(consultation) },
      actor.id,
    );
  }

  private async openFor(
    id: string,
    actor: ConsultationActor,
  ): Promise<Consultation> {
    const consultation = await this.consultations.findEditable(id, actor);
    assertOpenForEditing(consultation);
    return consultation;
  }

  private links(consultation: Consultation) {
    return {
      patientId: consultation.patientId,
      consultationId: consultation.id,
      visitId: consultation.visitId ?? undefined,
    };
  }
}
