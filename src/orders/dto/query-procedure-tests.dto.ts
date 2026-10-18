import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CatalogueFilterDTO } from 'common/dto/catalogue-filter.dto';
import { OrderKind } from '../enums/order-kind.enum';
import { ProcedureCategory } from '../enums/procedure-category.enum';

export class QueryProcedureTestsDto extends CatalogueFilterDTO {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;

  @IsOptional()
  @IsEnum(OrderKind)
  kind?: OrderKind;

  @IsOptional()
  @IsEnum(ProcedureCategory)
  category?: ProcedureCategory;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  isActive?: boolean;
}
