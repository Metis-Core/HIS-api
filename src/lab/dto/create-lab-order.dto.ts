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

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLabOrderItemDto)
  items: CreateLabOrderItemDto[];
}
