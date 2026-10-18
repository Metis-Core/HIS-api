import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LabPriority } from '../enums/lab-priority.enum';

export class CreateLabOrderItemDto {
  @IsUUID()
  testId: string;
}

export class CreateLabOrderDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  consultationId?: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsOptional()
  @IsEnum(LabPriority)
  priority?: LabPriority;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  clinicalNotes?: string;

  @IsOptional()
  @IsString({ message: 'referringClinician must be text' })
  @MaxLength(150, {
    message: 'referringClinician must be at most 150 characters',
  })
  referringClinician?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLabOrderItemDto)
  items: CreateLabOrderItemDto[];
}
