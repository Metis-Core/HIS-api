import { IsIn } from 'class-validator';
import { ChargeStatus } from '../enums/charge.enum';

export class UpdateChargeStatusDto {
  @IsIn([ChargeStatus.WAIVED, ChargeStatus.PENDING], {
    message:
      'Charges are marked paid by recording a payment; use waived or pending here',
  })
  status: ChargeStatus.WAIVED | ChargeStatus.PENDING;
}
