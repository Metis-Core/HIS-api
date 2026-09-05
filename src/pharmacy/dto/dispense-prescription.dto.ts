import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class DispenseItemDto {
  @IsUUID()
  prescriptionItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class DispensePrescriptionDto {
  @IsUUID()
  storeId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DispenseItemDto)
  items: DispenseItemDto[];
}
