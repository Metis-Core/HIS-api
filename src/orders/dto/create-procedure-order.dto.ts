import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { OrderPriority } from '../enums/order-priority.enum';

export class CreateProcedureOrderDto {
  @IsUUID('4')
  patientId: string;

  @IsUUID('4', { message: 'testId must be a test from the catalogue' })
  testId: string;

  @IsOptional()
  @IsUUID('4')
  visitId?: string;

  @IsOptional()
  @IsUUID('4')
  consultationId?: string;

  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  indication?: string;
}
