import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CloseDayDto {
  @Matches(DATE, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  countedCash?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
