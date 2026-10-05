import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateContactDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  relationship: string;
}
