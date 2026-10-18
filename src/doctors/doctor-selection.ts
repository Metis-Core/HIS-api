import {
  ASSIGNABLE_STATUSES,
  AvailabilityStatus,
} from 'common/enums/availability-status.enum';

export interface DoctorCandidate {
  id: string;
  availability: AvailabilityStatus;
  waiting: number;
  lastAssignedAt: Date | null;
}

const PREFERENCE: Record<AvailabilityStatus, number> = {
  [AvailabilityStatus.AVAILABLE]: 0,
  [AvailabilityStatus.BUSY]: 1,
  [AvailabilityStatus.ON_LEAVE]: 2,
  [AvailabilityStatus.OUT_OF_OFFICE]: 2,
};

export const isAssignable = (status: AvailabilityStatus): boolean =>
  ASSIGNABLE_STATUSES.includes(status);

const lastAssignedTime = (doctor: DoctorCandidate): number =>
  doctor.lastAssignedAt?.getTime() ?? Number.NEGATIVE_INFINITY;

export function pickDoctor(
  candidates: readonly DoctorCandidate[],
  excludeId?: string,
): string | null {
  const [best] = candidates
    .filter(
      (doctor) => doctor.id !== excludeId && isAssignable(doctor.availability),
    )
    .sort(
      (a, b) =>
        PREFERENCE[a.availability] - PREFERENCE[b.availability] ||
        a.waiting - b.waiting ||
        lastAssignedTime(a) - lastAssignedTime(b) ||
        a.id.localeCompare(b.id),
    );
  return best?.id ?? null;
}
