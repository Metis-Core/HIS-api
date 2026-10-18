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
import { LabOrderStatus } from '../enums/lab-order-status.enum';
import { LabPriority } from '../enums/lab-priority.enum';

export class QueryLabOrdersDto extends BaseFilterDTO {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsOptional()
  @IsUUID()
  orderedById?: string;

  // One status or several (comma-separated), e.g. PENDING,PARTIALLY_DISPENSED for an open-work tab.
  @IsOptional()
  @Transform(toList)
  @IsEnum(LabOrderStatus, {
    each: true,
    message: 'status must be a valid lab order status',
  })
  status?: LabOrderStatus[];

  @IsOptional()
  @IsString({ message: 'search must be text' })
  @MaxLength(64, { message: 'search must be at most 64 characters' })
  search?: string;

  @IsOptional()
  @IsEnum(LabPriority)
  priority?: LabPriority;
}
