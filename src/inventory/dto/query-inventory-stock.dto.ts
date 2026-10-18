import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CatalogueFilterDTO } from 'common/dto/catalogue-filter.dto';
import { MAX_PAGE_SIZE } from 'common/pagination';

export class QueryInventoryStockDTO extends CatalogueFilterDTO {
  @IsOptional()
  @IsUUID('4', { message: 'storeId must be a valid id' })
  storeId?: string;

  // Lets a screen fetch on-hand quantities for just the rows it shows (comma-separated ids).
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : value,
  )
  @IsArray({ message: 'itemIds must be a comma-separated list of ids' })
  @ArrayMaxSize(MAX_PAGE_SIZE, {
    message: `itemIds cannot list more than ${MAX_PAGE_SIZE} items`,
  })
  @IsUUID('4', { each: true, message: 'each itemId must be a valid id' })
  itemIds?: string[];

  @IsOptional()
  @IsString({ message: 'search must be text' })
  @MaxLength(64, { message: 'search must be at most 64 characters' })
  search?: string;
}
