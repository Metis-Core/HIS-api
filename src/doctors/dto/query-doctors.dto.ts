import { IsOptional, IsString, MaxLength } from 'class-validator';
import { BaseFilterDTO } from 'common/dto/filter.dto';

export class QueryDoctorsDto extends BaseFilterDTO {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}
