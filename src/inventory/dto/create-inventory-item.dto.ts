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
} from 'class-validator';
import { InventoryItemType } from '../enums/inventory-item-type.enum';
import { UnitOfMeasure } from '../enums/uintMeasure.enum';

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
  @Min(0)
  minStockLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
