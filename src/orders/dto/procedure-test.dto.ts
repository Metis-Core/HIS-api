import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { LabResultSchemaDTO } from 'src/lab/dto/lab-result-schema.dto';
import { OrderKind } from '../enums/order-kind.enum';
import { ProcedureCategory } from '../enums/procedure-category.enum';

export class CreateProcedureTestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code uses capital letters, numbers, - and _',
  })
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  abbreviation?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(OrderKind)
  kind: OrderKind;

  @IsEnum(ProcedureCategory)
  category: ProcedureCategory;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  preparation?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LabResultSchemaDTO)
  resultSchema?: LabResultSchemaDTO;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProcedureTestDto extends PartialType(
  CreateProcedureTestDto,
) {}
