import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BaseFilterDTO } from 'common/dto/filter.dto';
import { LabSampleType } from '../enums/lab-sample-type.enum';
import { LabTestCategory } from '../enums/lab-test-category.enum';

export class QueryLabTestsDto extends BaseFilterDTO {
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
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
