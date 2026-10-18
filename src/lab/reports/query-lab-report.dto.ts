import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DateRangeFilterDTO } from 'common/dto/date-range.dto';
import { Gender } from 'common/enums/gender.enum';
import { AgeBand } from './age-band';

/** L11: verified results counted by test, sex and age band over the chosen days. */
export class QueryLabReportDto extends DateRangeFilterDTO {
  @IsOptional()
  @IsEnum(Gender, { message: 'gender must be male, female, other or unknown' })
  gender?: Gender;

  @IsOptional()
  @IsEnum(AgeBand, {
    message: `ageBand must be one of: ${Object.values(AgeBand).join(', ')}`,
  })
  ageBand?: AgeBand;

  @IsOptional()
  @IsUUID('4', { message: 'test must be a valid lab test id' })
  test?: string;
}
