import { IsEnum, IsOptional, IsUUID } from 'class-validator';
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

  @IsOptional()
  @IsEnum(LabOrderStatus)
  status?: LabOrderStatus;

  @IsOptional()
  @IsEnum(LabPriority)
  priority?: LabPriority;
}
