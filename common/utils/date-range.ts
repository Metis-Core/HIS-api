import { BadRequestException } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface DayRange {
  from?: string;
  to?: string;
}

const day = (value: string): string => value.slice(0, 10);

/** Rejects a range that ends before it starts, so the user sees why nothing matched. */
export function assertDayRange(range: DayRange): void {
  if (range.from && range.to && day(range.from) > day(range.to)) {
    throw new BadRequestException('from must be on or before to');
  }
}

/** Limits `column` to whole days from `from` to `to` inclusive (half-open upper bound). */
export function whereDayRange<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  column: string,
  range: DayRange,
): void {
  assertDayRange(range);
  if (range.from) {
    qb.andWhere(`${column} >= CAST(:rangeFrom AS date)`, {
      rangeFrom: day(range.from),
    });
  }
  if (range.to) {
    qb.andWhere(`${column} < CAST(:rangeTo AS date) + 1`, {
      rangeTo: day(range.to),
    });
  }
}
