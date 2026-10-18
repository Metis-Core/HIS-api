import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DateRangeFilterDTO } from 'common/dto/date-range.dto';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enum';

export class QueryPaymentsDto extends DateRangeFilterDTO {
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsUUID('4')
  receivedById?: string;

  @IsOptional()
  @IsUUID('4')
  invoiceId?: string;
}
