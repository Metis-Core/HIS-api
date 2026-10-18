import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MaxLength,
} from 'class-validator';
import { SERVICE_CODE_PATTERN } from '../service-codes';

export class CreateServiceDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(SERVICE_CODE_PATTERN, {
    message:
      'code must be 2-32 characters: uppercase letters, digits or underscores, starting with a letter',
  })
  code?: string;

  @IsNumber()
  @Min(0)
  fee: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
