import { BadRequestException } from '@nestjs/common';
import { businessDateOf } from 'common/utils/business-date';

const DAY_MS = 86_400_000;
const DEFAULT_SPAN_DAYS = 7;
const MAX_SPAN_DAYS = 366;

export interface DayWindow {
  from: string;
  to: string;
}

const day = (value: string): string => value.slice(0, 10);

export function resolveWindow(
  range: { from?: string; to?: string },
  now: Date = new Date(),
): DayWindow {
  const to = range.to ? day(range.to) : businessDateOf(now);
  const from = range.from
    ? day(range.from)
    : businessDateOf(
        new Date(
          Date.parse(`${to}T12:00:00Z`) - (DEFAULT_SPAN_DAYS - 1) * DAY_MS,
        ),
      );
  if (from > to) throw new BadRequestException('from must be on or before to');
  const span =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS;
  if (span >= MAX_SPAN_DAYS) {
    throw new BadRequestException('Choose a range of at most one year');
  }
  return { from, to };
}
