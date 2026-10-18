import { AvailabilityStatus } from 'common/enums/availability-status.enum';
import { PeriodWindow, resolveAvailability } from './resolve-availability';

const NOW = new Date('2026-10-18T09:00:00Z');
const at = (iso: string) => new Date(iso);

const period = (overrides: Partial<PeriodWindow>): PeriodWindow => ({
  id: 'p1',
  status: AvailabilityStatus.ON_LEAVE,
  startsAt: at('2026-10-17T00:00:00Z'),
  endsAt: at('2026-10-20T00:00:00Z'),
  note: null,
  ...overrides,
});

describe('resolveAvailability', () => {
  it('is available when there is no period', () => {
    expect(resolveAvailability([], NOW).status).toBe(
      AvailabilityStatus.AVAILABLE,
    );
  });

  it('applies a period that is under way and reports when it ends', () => {
    const resolved = resolveAvailability([period({})], NOW);
    expect(resolved.status).toBe(AvailabilityStatus.ON_LEAVE);
    expect(resolved.until).toEqual(at('2026-10-20T00:00:00Z'));
  });

  it('ignores planned leave that has not started yet', () => {
    const planned = period({
      startsAt: at('2026-10-25T00:00:00Z'),
      endsAt: at('2026-10-30T00:00:00Z'),
    });
    expect(resolveAvailability([planned], NOW).status).toBe(
      AvailabilityStatus.AVAILABLE,
    );
  });

  it('returns to available by itself once the period has ended', () => {
    const over = period({ endsAt: at('2026-10-18T08:59:00Z') });
    expect(resolveAvailability([over], NOW).status).toBe(
      AvailabilityStatus.AVAILABLE,
    );
  });

  it('keeps an open-ended period until it is ended', () => {
    const open = period({
      status: AvailabilityStatus.OUT_OF_OFFICE,
      endsAt: null,
    });
    const resolved = resolveAvailability([open], NOW);
    expect(resolved.status).toBe(AvailabilityStatus.OUT_OF_OFFICE);
    expect(resolved.until).toBeNull();
  });

  it('lets leave win over busy when both overlap', () => {
    const busy = period({
      id: 'busy',
      status: AvailabilityStatus.BUSY,
      endsAt: at('2026-10-18T10:00:00Z'),
    });
    const leave = period({ id: 'leave' });
    expect(resolveAvailability([busy, leave], NOW).periodId).toBe('leave');
  });
});
