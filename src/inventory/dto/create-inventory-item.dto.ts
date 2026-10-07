import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryItemType } from '../enums/inventory-item-type.enum';
import { UnitOfMeasure } from '../enums/uintMeasure.enum';
import { InitialStockDto } from './initial-stock.dto';

export class CreateInventoryItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[A-Z0-9_-]+$/)
  sku: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(InventoryItemType)
  type: InventoryItemType;

  @IsEnum(UnitOfMeasure)
  unitOfMeasure: UnitOfMeasure;

  @IsOptional()
  @IsInt()
  @Min(1)
  packSize?: number;

  @IsOptional()
  @IsEnum(UnitOfMeasure)
  packUnit?: UnitOfMeasure;

  @IsOptional()
  @ValidateNested()
  @Type(() => InitialStockDto)
  initialStock?: InitialStockDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStockLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  strength?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dosageForm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  genericName?: string;

  @IsOptional()
  @IsBoolean()
  isControlled?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
