import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export enum InsuranceVerificationMethod {
  PHONE = 'phone',
  PORTAL = 'portal',
  CARD = 'card',
}

export class InsuranceVerificationDto {
  @IsEnum(InsuranceVerificationMethod)
  method: InsuranceVerificationMethod;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reference: string;
}
