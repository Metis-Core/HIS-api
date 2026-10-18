import { IsString, MaxLength, MinLength } from 'class-validator';

export class VoidPaymentDto {
  @IsString()
  @MinLength(3, { message: 'Give a reason for voiding the payment' })
  @MaxLength(255)
  reason: string;
}
