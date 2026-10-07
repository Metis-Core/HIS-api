import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { QuantityUnit } from '../enums/quantity-unit.enum';

export class InitialStockDto {
  @IsUUID()
  storeId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsEnum(QuantityUnit)
  quantityUnit?: QuantityUnit;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  batchNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsDateString()
  manufactureDate?: string;
}
