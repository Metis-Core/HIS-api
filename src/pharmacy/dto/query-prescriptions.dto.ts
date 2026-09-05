import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BaseFilterDTO } from 'common/dto/filter.dto';
import { PrescriptionStatus } from '../enums/prescription-status.enum';

export class QueryPrescriptionsDto extends BaseFilterDTO {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsUUID()
  prescribedById?: string;

  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;
}
