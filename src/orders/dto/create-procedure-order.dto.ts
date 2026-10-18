import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { OrderKind } from '../enums/order-kind.enum';
import { OrderPriority } from '../enums/order-priority.enum';

export class CreateProcedureOrderDto {
  @IsUUID('4')
  patientId: string;

  @IsEnum(OrderKind, { message: 'kind must be radiology or surgery' })
  kind: OrderKind;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsUUID('4')
  visitId?: string;

  @IsOptional()
  @IsUUID('4')
  consultationId?: string;

  @IsOptional()
  @IsUUID('4')
  serviceId?: string;

  @IsOptional()
  @IsEnum(OrderPriority)
  priority?: OrderPriority;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  indication?: string;
}
