import { BadRequestException } from '@nestjs/common';
import { QueueEntryStatus } from './enums/queue-entry-status.enum';

const TRANSITIONS: Record<QueueEntryStatus, readonly QueueEntryStatus[]> = {
  [QueueEntryStatus.WAITING]: [
    QueueEntryStatus.CALLED,
    QueueEntryStatus.IN_SERVICE,
    QueueEntryStatus.COMPLETED,
    QueueEntryStatus.SKIPPED,
    QueueEntryStatus.TRANSFERRED,
  ],
  [QueueEntryStatus.CALLED]: [
    QueueEntryStatus.IN_SERVICE,
    QueueEntryStatus.COMPLETED,
    QueueEntryStatus.SKIPPED,
    QueueEntryStatus.TRANSFERRED,
  ],
  [QueueEntryStatus.IN_SERVICE]: [
    QueueEntryStatus.COMPLETED,
    QueueEntryStatus.SKIPPED,
    QueueEntryStatus.TRANSFERRED,
  ],
  [QueueEntryStatus.COMPLETED]: [],
  [QueueEntryStatus.SKIPPED]: [],
  [QueueEntryStatus.TRANSFERRED]: [],
};

export function canTransition(
  from: QueueEntryStatus,
  to: QueueEntryStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(
  from: QueueEntryStatus,
  to: QueueEntryStatus,
): void {
  if (!canTransition(from, to)) {
    throw new BadRequestException(
      `Invalid queue transition from ${from} to ${to}`,
    );
  }
}
