import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LabOrderItemStatus } from '../enums/lab-order-item-status.enum';
import type { LabResultData } from '../results/result-schema.types';

export class UpdateLabOrderItemDto {
  @IsOptional()
  @IsEnum(LabOrderItemStatus, {
    message: 'status must be a valid lab item status',
  })
  status?: LabOrderItemStatus;

  // Shape is checked against the test's template in the service.
  @IsOptional()
  @IsObject({ message: 'resultData must be an object of field values' })
  resultData?: LabResultData;

  @IsOptional()
  @IsString({ message: 'resultNotes must be text' })
  @MaxLength(2000, { message: 'resultNotes must be at most 2000 characters' })
  resultNotes?: string;
}
