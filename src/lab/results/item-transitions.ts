import { ConflictException } from '@nestjs/common';
import { LabOrderItemStatus as S } from '../enums/lab-order-item-status.enum';

// Verification has its own endpoint, so VERIFIED is never a target here.
const NEXT: Record<S, readonly S[]> = {
  [S.PENDING]: [S.COLLECTED, S.RESULT_READY, S.CANCELLED],
  [S.COLLECTED]: [S.IN_PROCESS, S.RESULT_READY, S.CANCELLED],
  [S.IN_PROCESS]: [S.RESULT_READY, S.CANCELLED],
  [S.RESULT_READY]: [S.RESULT_READY, S.IN_PROCESS, S.CANCELLED],
  [S.VERIFIED]: [],
  [S.CANCELLED]: [],
};

export function assertEditable(status: S): void {
  if (status === S.VERIFIED) {
    throw new ConflictException(
      'This result is verified and locked; amend it with a reason instead',
    );
  }
  if (status === S.CANCELLED) {
    throw new ConflictException('This test was cancelled');
  }
}

export function assertTransition(from: S, to: S): void {
  assertEditable(from);
  if (from !== to && !NEXT[from].includes(to)) {
    throw new ConflictException(
      `A ${from.replaceAll('_', ' ')} test cannot move to ${to.replaceAll('_', ' ')}`,
    );
  }
}

export const OPEN_ITEM_STATUSES: readonly S[] = [
  S.PENDING,
  S.COLLECTED,
  S.IN_PROCESS,
  S.RESULT_READY,
];
