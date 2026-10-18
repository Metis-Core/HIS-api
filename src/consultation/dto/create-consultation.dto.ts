import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Department } from 'common/enums/department.enum';
import { ConsultationType } from 'src/consultation/enums/consultation-type.enum';

export class CreateConsultationDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsOptional()
  @IsUUID()
  triageId?: string;

  @IsOptional()
  @IsEnum(ConsultationType)
  type?: ConsultationType;

  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  chiefComplaint: string;

  @IsOptional()
  @IsString()
  historyOfPresentIllness?: string;

  @IsOptional()
  @IsString({ message: 'Examination and assessment must be text' })
  examinationAndAssessment?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  icd10Codes?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;
}
