import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { toList } from 'common/utils/query-list';
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

  // One status or several (comma-separated), e.g. PENDING,PARTIALLY_DISPENSED for an open-work tab.
  @IsOptional()
  @Transform(toList)
  @IsEnum(PrescriptionStatus, {
    each: true,
    message: 'status must be a valid prescription status',
  })
  status?: PrescriptionStatus[];

  @IsOptional()
  @IsString({ message: 'search must be text' })
  @MaxLength(64, { message: 'search must be at most 64 characters' })
  search?: string;
}
