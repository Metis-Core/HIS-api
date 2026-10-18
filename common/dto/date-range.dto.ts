import { IsDateString, IsOptional } from 'class-validator';
import { BaseFilterDTO } from './filter.dto';

/** List filter by calendar day; `to` is inclusive. */
export class DateRangeFilterDTO extends BaseFilterDTO {
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'from must be a date (YYYY-MM-DD)' },
  )
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'to must be a date (YYYY-MM-DD)' })
  to?: string;
}
