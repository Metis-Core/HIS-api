import { IsEnum } from 'class-validator';
import { ChargeStatus } from '../enums/charge.enum';

export class UpdateChargeStatusDto {
  @IsEnum(ChargeStatus)
  status: ChargeStatus;
}
