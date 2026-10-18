import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LabOrderItemStatus } from '../enums/lab-order-item-status.enum';
import type { LabResultData } from '../results/result-schema.types';

const SETTABLE = Object.values(LabOrderItemStatus).filter(
  (s) => s !== LabOrderItemStatus.VERIFIED,
);

export class UpdateLabOrderItemDto {
  @IsOptional()
  @IsIn(SETTABLE, {
    message: `status must be one of: ${SETTABLE.join(', ')} (verify has its own action)`,
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
