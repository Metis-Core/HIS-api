import { OmitType } from '@nestjs/mapped-types';
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
) {}
