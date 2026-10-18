export enum AvailabilityStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_LEAVE = 'on_leave',
  OUT_OF_OFFICE = 'out_of_office',
}

export const ASSIGNABLE_STATUSES: readonly AvailabilityStatus[] = [
  AvailabilityStatus.AVAILABLE,
  AvailabilityStatus.BUSY,
];

export const PLANNABLE_STATUSES: readonly AvailabilityStatus[] = [
  AvailabilityStatus.BUSY,
  AvailabilityStatus.ON_LEAVE,
  AvailabilityStatus.OUT_OF_OFFICE,
];
