import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CatalogueFilterDTO } from 'common/dto/catalogue-filter.dto';
import { InventoryItemType } from '../enums/inventory-item-type.enum';

export class QueryInventoryItemsDto extends CatalogueFilterDTO {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;

  @IsOptional()
  @IsEnum(InventoryItemType)
  type?: InventoryItemType;

  @IsOptional()
  @Transform(({ value }) =>
    value === 'false' ? false : value === 'true' ? true : value,
  )
  @IsBoolean()
  isActive?: boolean;
}
