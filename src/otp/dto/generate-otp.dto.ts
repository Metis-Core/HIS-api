import { IsUUID } from 'class-validator';

export class GenerateOtpDto {
  @IsUUID()
  userId: string;
}
