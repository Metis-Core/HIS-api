import { BadRequestException } from '@nestjs/common';
import { AvailabilityStatus } from 'common/enums/availability-status.enum';
import { buildPeriodDates } from './build-period-dates';

const NOW = new Date('2026-10-18T09:00:00Z');

describe('buildPeriodDates', () => {
  it('starts now when no start is given and computes the end from a duration', () => {
    const dates = buildPeriodDates(
      { status: AvailabilityStatus.BUSY, durationMinutes: 90 },
      NOW,
    );
    expect(dates.startsAt).toEqual(NOW);
    expect(dates.endsAt).toEqual(new Date('2026-10-18T10:30:00Z'));
  });

  it('accepts leave planned for later days', () => {
    const dates = buildPeriodDates(
      {
        status: AvailabilityStatus.ON_LEAVE,
        startsAt: new Date('2026-11-02T00:00:00Z'),
        endsAt: new Date('2026-11-09T00:00:00Z'),
      },
      NOW,
    );
    expect(dates.startsAt).toEqual(new Date('2026-11-02T00:00:00Z'));
  });

  it('allows open-ended leave', () => {
    expect(
      buildPeriodDates({ status: AvailabilityStatus.ON_LEAVE }, NOW).endsAt,
    ).toBeNull();
  });

  it('requires busy to have an end', () => {
    expect(() =>
      buildPeriodDates({ status: AvailabilityStatus.BUSY }, NOW),
    ).toThrow(BadRequestException);
  });

  it('rejects busy longer than 12 hours', () => {
    expect(() =>
      buildPeriodDates(
        { status: AvailabilityStatus.BUSY, durationMinutes: 13 * 60 },
        NOW,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects an end before the start and a start in the past', () => {
    expect(() =>
      buildPeriodDates(
        {
          status: AvailabilityStatus.ON_LEAVE,
          endsAt: new Date('2026-10-18T08:00:00Z'),
        },
        NOW,
      ),
    ).toThrow(BadRequestException);
    expect(() =>
      buildPeriodDates(
        {
          status: AvailabilityStatus.ON_LEAVE,
          startsAt: new Date('2026-10-17T09:00:00Z'),
        },
        NOW,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects both an end time and a duration', () => {
    expect(() =>
      buildPeriodDates(
        {
          status: AvailabilityStatus.ON_LEAVE,
          endsAt: new Date('2026-10-20T00:00:00Z'),
          durationMinutes: 60,
        },
        NOW,
      ),
    ).toThrow(BadRequestException);
  });
});
