import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AvailabilityStatus } from 'common/enums/availability-status.enum';

export const MAX_DURATION_MINUTES = 60 * 24 * 365;

export class SetAvailabilityDto {
  @IsEnum(AvailabilityStatus, {
    message: 'status must be available, busy, on_leave or out_of_office',
  })
  status: AvailabilityStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startsAt must be a valid date' })
  startsAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'endsAt must be a valid date' })
  endsAt?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'durationMinutes must be a whole number' })
  @Min(1)
  @Max(MAX_DURATION_MINUTES)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
