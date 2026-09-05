import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BaseFilterDTO } from 'common/dto/filter.dto';
import { InventoryTransactionType } from '../enums/inventoryTransactionType.enum';

export class QueryInventoryTransactionsDto extends BaseFilterDTO {
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsUUID()
  itemId?: string;

  @IsOptional()
  @IsEnum(InventoryTransactionType)
  type?: InventoryTransactionType;

  @IsOptional()
  @IsUUID()
  performedById?: string;
}
