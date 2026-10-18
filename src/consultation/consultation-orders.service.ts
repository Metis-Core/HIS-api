import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { LabOrder } from 'src/lab/entities/lab-order.entity';
import { LabOrderIntakeService } from 'src/lab/lab-order-intake.service';
import { Prescription } from 'src/pharmacy/entities/prescription.entity';
import { PharmacyService } from 'src/pharmacy/pharmacy.service';
import { AllergyMatch, findAllergyMatches } from './allergy-check';
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
    private readonly labOrders: LabOrderIntakeService,
    private readonly pharmacy: PharmacyService,
    @InjectRepository(InventoryItem)
    private readonly items: Repository<InventoryItem>,
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
    const { allergyAcknowledged, ...prescription } = dto;
    const matches = await this.allergyMatches(consultation, dto);
    if (matches.length && !allergyAcknowledged) {
      throw new UnprocessableEntityException(
        `Allergy warning: ${describeMatches(matches)}. Confirm to prescribe anyway.`,
      );
    }
    const notes = matches.length
      ? [
          `Allergy warning acknowledged: ${describeMatches(matches)}.`,
          dto.notes,
        ]
          .filter(Boolean)
          .join('\n')
      : dto.notes;
    return this.pharmacy.createPrescription(
      { ...prescription, notes, ...this.links(consultation) },
      actor.id,
    );
  }

  private async allergyMatches(
    consultation: Consultation,
    dto: CreateConsultationPrescriptionDTO,
  ): Promise<AllergyMatch[]> {
    const allergies = consultation.patient?.allergies;
    if (!allergies?.trim()) return [];
    const medications = await this.items.findBy({
      id: In(dto.items.map((item) => item.itemId)),
    });
    return findAllergyMatches(allergies, medications);
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

const describeMatches = (matches: AllergyMatch[]) =>
  matches.map((m) => `${m.medication} (allergy: ${m.allergy})`).join(', ');
