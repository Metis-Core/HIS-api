import { IsDateString, IsOptional } from 'class-validator';

export class AnalyticsRangeDto {
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
