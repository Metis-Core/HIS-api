import { BadRequestException } from '@nestjs/common';
import { AvailabilityStatus } from 'common/enums/availability-status.enum';
import {
  MAX_DURATION_MINUTES,
  SetAvailabilityDto,
} from './dto/set-availability.dto';

const MINUTE_MS = 60_000;
const START_GRACE_MS = 5 * MINUTE_MS;
const MAX_BUSY_MINUTES = 12 * 60;

export interface PeriodDates {
  startsAt: Date;
  endsAt: Date | null;
}

export function buildPeriodDates(
  dto: Pick<
    SetAvailabilityDto,
    'status' | 'startsAt' | 'endsAt' | 'durationMinutes'
  >,
  now: Date,
): PeriodDates {
  if (dto.endsAt && dto.durationMinutes) {
    throw new BadRequestException(
      'Give either an end time or a duration, not both',
    );
  }
  const startsAt = dto.startsAt ?? now;
  if (startsAt.getTime() < now.getTime() - START_GRACE_MS) {
    throw new BadRequestException('A period cannot start in the past');
  }
  const endsAt =
    dto.endsAt ??
    (dto.durationMinutes
      ? new Date(startsAt.getTime() + dto.durationMinutes * MINUTE_MS)
      : null);
  if (endsAt && endsAt <= startsAt) {
    throw new BadRequestException('The end must be after the start');
  }
  const horizon = new Date(now.getTime() + MAX_DURATION_MINUTES * MINUTE_MS);
  if (startsAt > horizon || (endsAt && endsAt > horizon)) {
    throw new BadRequestException('Plan at most one year ahead');
  }
  if (dto.status === AvailabilityStatus.BUSY) {
    if (!endsAt) {
      throw new BadRequestException('Say how long you will be busy');
    }
    if (endsAt.getTime() - startsAt.getTime() > MAX_BUSY_MINUTES * MINUTE_MS) {
      throw new BadRequestException(
        'Busy can last at most 12 hours; use leave or out of office for longer',
      );
    }
  }
  return { startsAt, endsAt };
}
