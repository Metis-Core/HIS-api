import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Department } from 'common/enums/department.enum';
import { InventoryStoreType } from '../enums/inventoryType.enum';

export class CreateInventoryStoreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(InventoryStoreType)
  type: InventoryStoreType;

  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
