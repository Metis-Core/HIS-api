import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LabOrderStatus } from '../enums/lab-order-status.enum';
import { LabPriority } from '../enums/lab-priority.enum';

export class UpdateLabOrderDto {
  @IsOptional()
  @IsEnum(LabOrderStatus)
  status?: LabOrderStatus;

  @IsOptional()
  @IsEnum(LabPriority)
  priority?: LabPriority;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  clinicalNotes?: string;
}
