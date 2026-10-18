import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { VisitTypeEnum } from 'src/queue/enums/visit-type.enum';
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
}
