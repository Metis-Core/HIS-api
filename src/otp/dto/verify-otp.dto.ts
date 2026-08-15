import { IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  verificationToken: string;

  @IsString()
  @Length(4, 4)
  code: string;
}
