import { OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateLabOrderDto } from 'src/lab/dto/create-lab-order.dto';
import { CreatePrescriptionDto } from 'src/pharmacy/dto/create-prescription.dto';

// Patient, consultation and visit always come from the consultation in the URL, never the body (H-5).
const LINKED = ['patientId', 'consultationId', 'visitId'] as const;

export class CreateConsultationLabOrderDTO extends OmitType(
  CreateLabOrderDto,
  LINKED,
) {}

export class CreateConsultationPrescriptionDTO extends OmitType(
  CreatePrescriptionDto,
  LINKED,
) {
  /** The doctor has seen the allergy warning and prescribes anyway (M-12). */
  @IsOptional()
  @IsBoolean()
  allergyAcknowledged?: boolean;
}
