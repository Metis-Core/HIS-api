import { AvailabilityStatus } from 'common/enums/availability-status.enum';

export interface PeriodWindow {
  id: string;
  status: AvailabilityStatus;
  startsAt: Date;
  endsAt: Date | null;
  note: string | null;
}

export interface ResolvedAvailability {
  status: AvailabilityStatus;
  until: Date | null;
  note: string | null;
  periodId: string | null;
}

export const AVAILABLE_NOW: ResolvedAvailability = {
  status: AvailabilityStatus.AVAILABLE,
  until: null,
  note: null,
  periodId: null,
};

const SEVERITY: Record<AvailabilityStatus, number> = {
  [AvailabilityStatus.AVAILABLE]: 0,
  [AvailabilityStatus.BUSY]: 1,
  [AvailabilityStatus.ON_LEAVE]: 2,
  [AvailabilityStatus.OUT_OF_OFFICE]: 2,
};

export function isActiveAt(period: PeriodWindow, now: Date): boolean {
  return (
    period.startsAt <= now && (period.endsAt === null || period.endsAt > now)
  );
}

export function resolveAvailability(
  periods: readonly PeriodWindow[],
  now: Date,
): ResolvedAvailability {
  const [winner] = periods
    .filter((period) => isActiveAt(period, now))
    .sort(
      (a, b) =>
        SEVERITY[b.status] - SEVERITY[a.status] ||
        b.startsAt.getTime() - a.startsAt.getTime(),
    );
  if (!winner) return AVAILABLE_NOW;
  return {
    status: winner.status,
    until: winner.endsAt,
    note: winner.note,
    periodId: winner.id,
  };
}
