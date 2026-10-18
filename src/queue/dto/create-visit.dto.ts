import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ServiceVisitKind } from 'src/queue/enums/service-visit.enum';
import {
  VisitIntenentsEnum,
  VisitTypeEnum,
} from 'src/queue/enums/visit-type.enum';
import { BOOKABLE_STAGES } from '../journey/check-in-plan';
import { TriageCategory } from 'src/queue/enums/triage-category.enum';
import { InsuranceVerificationDto } from './insurance-verification.dto';

export class CreateVisitDTO {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsEnum(VisitTypeEnum)
  visitType?: VisitTypeEnum;

  @IsOptional()
  @IsEnum(TriageCategory, {
    message: `triageCategory must be one of: ${Object.values(TriageCategory).join(', ')}`,
  })
  triageCategory?: TriageCategory;

  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceVerificationDto)
  insuranceVerification?: InsuranceVerificationDto;

  /** Triage first; on unless reception switches it off. */
  @IsOptional()
  @IsBoolean()
  triage?: boolean;

  /** See a doctor; on unless the patient came only for other services. */
  @IsOptional()
  @IsBoolean()
  consultation?: boolean;

  @IsOptional()
  @IsEnum(ServiceVisitKind)
  service?: ServiceVisitKind;

  @IsOptional()
  @IsArray()
  @IsIn(BOOKABLE_STAGES, { each: true })
  stages?: VisitIntenentsEnum[];

  /** The patient asked for this doctor by name. */
  @IsOptional()
  @IsUUID()
  preferredDoctorId?: string;
}
