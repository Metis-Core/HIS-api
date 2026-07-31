import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._-]{3,32}$/)
  username: string;

  @IsString()
  @MinLength(12)
  password: string;
}
