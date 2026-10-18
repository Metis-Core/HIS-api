import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'scheduledFor must be a valid date' })
  scheduledFor?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  report?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
