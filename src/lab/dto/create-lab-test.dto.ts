import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LabSampleType } from '../enums/lab-sample-type.enum';
import { LabTestCategory } from '../enums/lab-test-category.enum';

export class LabResultFieldDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_]+$/)
  key: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  label: string;

  @IsIn(['number', 'text', 'select', 'boolean'])
  type: 'number' | 'text' | 'select' | 'boolean';

  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  referenceRange?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  helpText?: string;
}

export class LabResultSchemaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LabResultFieldDto)
  fields: LabResultFieldDto[];
}

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
  @ValidateNested()
  @Type(() => LabResultSchemaDto)
  resultSchema?: LabResultSchemaDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
