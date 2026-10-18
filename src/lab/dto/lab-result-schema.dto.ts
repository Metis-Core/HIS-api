import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  LabRangeSex,
  LabResultFieldType,
} from '../results/result-schema.types';

const MAX_AGE_YEARS = 150;

export class LabReferenceRangeDTO {
  @IsOptional()
  @IsIn(['male', 'female'], { message: 'sex must be male or female' })
  sex?: LabRangeSex;

  @IsOptional()
  @IsNumber({}, { message: 'minAgeYears must be a number' })
  @Min(0, { message: 'minAgeYears cannot be negative' })
  @Max(MAX_AGE_YEARS, {
    message: `minAgeYears must be at most ${MAX_AGE_YEARS}`,
  })
  minAgeYears?: number;

  @IsOptional()
  @IsNumber({}, { message: 'maxAgeYears must be a number' })
  @Min(0, { message: 'maxAgeYears cannot be negative' })
  @Max(MAX_AGE_YEARS, {
    message: `maxAgeYears must be at most ${MAX_AGE_YEARS}`,
  })
  maxAgeYears?: number;

  @IsOptional()
  @IsNumber({}, { message: 'low must be a number' })
  low?: number;

  @IsOptional()
  @IsNumber({}, { message: 'high must be a number' })
  high?: number;

  @IsOptional()
  @IsNumber({}, { message: 'criticalLow must be a number' })
  criticalLow?: number;

  @IsOptional()
  @IsNumber({}, { message: 'criticalHigh must be a number' })
  criticalHigh?: number;
}

export class LabResultFieldDTO {
  @IsString({ message: 'key must be text' })
  @IsNotEmpty({ message: 'key is required' })
  @MaxLength(64, { message: 'key must be at most 64 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'key may only use letters, digits and _',
  })
  key: string;

  @IsString({ message: 'label must be text' })
  @IsNotEmpty({ message: 'label is required' })
  @MaxLength(150, { message: 'label must be at most 150 characters' })
  label: string;

  @IsIn(['number', 'text', 'select', 'boolean'], {
    message: 'type must be number, text, select or boolean',
  })
  type: LabResultFieldType;

  @IsOptional()
  @IsString({ message: 'unit must be text' })
  @MaxLength(32, { message: 'unit must be at most 32 characters' })
  unit?: string;

  @IsOptional()
  @IsArray({ message: 'options must be a list' })
  @ArrayMaxSize(50, { message: 'options can list at most 50 values' })
  @IsString({ each: true, message: 'each option must be text' })
  options?: string[];

  @IsOptional()
  @IsBoolean({ message: 'required must be true or false' })
  required?: boolean;

  @IsOptional()
  @IsString({ message: 'helpText must be text' })
  @MaxLength(255, { message: 'helpText must be at most 255 characters' })
  helpText?: string;

  @IsOptional()
  @IsString({ message: 'group must be text' })
  @MaxLength(64, { message: 'group must be at most 64 characters' })
  group?: string;

  @IsOptional()
  @IsArray({ message: 'ranges must be a list' })
  @ArrayMaxSize(20, { message: 'a field can have at most 20 ranges' })
  @ValidateNested({ each: true })
  @Type(() => LabReferenceRangeDTO)
  ranges?: LabReferenceRangeDTO[];

  @IsOptional()
  @IsArray({ message: 'normalValues must be a list' })
  @ArrayMaxSize(50, { message: 'normalValues can list at most 50 values' })
  @IsString({ each: true, message: 'each normal value must be text' })
  normalValues?: string[];
}

export class LabResultSchemaDTO {
  @IsArray({ message: 'fields must be a list' })
  @ArrayMinSize(1, { message: 'a template needs at least one field' })
  @ArrayMaxSize(100, { message: 'a template can have at most 100 fields' })
  @ValidateNested({ each: true })
  @Type(() => LabResultFieldDTO)
  fields: LabResultFieldDTO[];
}
