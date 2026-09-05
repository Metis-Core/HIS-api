import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LabSampleType } from '../enums/lab-sample-type.enum';
import { LabTestCategory } from '../enums/lab-test-category.enum';

export class CreateLabTestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(/^[A-Z0-9_-]+$/)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(LabTestCategory)
  category: LabTestCategory;

  @IsEnum(LabSampleType)
  sampleType: LabSampleType;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  referenceRange?: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(720)
  turnaroundHours?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
