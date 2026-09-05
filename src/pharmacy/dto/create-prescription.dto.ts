import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePrescriptionItemDto {
  @IsUUID()
  itemId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dosage: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  frequency: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  duration?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}
