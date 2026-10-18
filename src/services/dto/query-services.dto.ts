import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { CatalogueFilterDTO } from 'common/dto/catalogue-filter.dto';

export class QueryServicesDTO extends CatalogueFilterDTO {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  isActive?: boolean;
}
