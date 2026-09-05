import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LabOrderItemStatus } from '../enums/lab-order-item-status.enum';

export class UpdateLabOrderItemDto {
  @IsOptional()
  @IsEnum(LabOrderItemStatus)
  status?: LabOrderItemStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  resultValue?: string;

  @IsOptional()
  @IsString()
  resultNotes?: string;

  @IsOptional()
  @IsBoolean()
  isAbnormal?: boolean;
}
