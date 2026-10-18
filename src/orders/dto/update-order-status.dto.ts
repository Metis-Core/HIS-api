import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { LabResultData } from 'src/lab/results/result-schema.types';
import { OrderStatus } from '../enums/order-status.enum';
import { ResultClassification } from '../enums/result-classification.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'scheduledFor must be a valid date' })
  scheduledFor?: Date;

  @IsOptional()
  @IsObject()
  resultData?: LabResultData;

  @IsOptional()
  @IsEnum(ResultClassification)
  classification?: ResultClassification;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  impression?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  report?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
