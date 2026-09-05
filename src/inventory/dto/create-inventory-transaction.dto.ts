import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { InventoryTransactionType } from '../enums/inventoryTransactionType.enum';

export class CreateInventoryTransactionDto {
  @IsUUID()
  storeId: string;

  @IsUUID()
  itemId: string;

  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsUUID()
  counterpartStoreId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceType?: string;

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
