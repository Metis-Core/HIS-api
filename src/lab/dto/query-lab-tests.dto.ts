import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CatalogueFilterDTO } from 'common/dto/catalogue-filter.dto';
import { LabSampleType } from '../enums/lab-sample-type.enum';
import { LabTestCategory } from '../enums/lab-test-category.enum';

export class QueryLabTestsDto extends CatalogueFilterDTO {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;

  @IsOptional()
  @IsEnum(LabTestCategory)
  category?: LabTestCategory;

  @IsOptional()
  @IsEnum(LabSampleType)
  sampleType?: LabSampleType;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  isActive?: boolean;
}
