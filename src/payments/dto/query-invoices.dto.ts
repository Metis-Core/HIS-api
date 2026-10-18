import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DateRangeFilterDTO } from 'common/dto/date-range.dto';
import { InvoiceStatus } from '../enums/payment.enum';

export class QueryInvoicesDto extends DateRangeFilterDTO {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsEnum(InvoiceStatus, { each: true })
  status?: InvoiceStatus[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}
