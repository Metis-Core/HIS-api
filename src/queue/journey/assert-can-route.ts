import { ForbiddenException } from '@nestjs/common';
import { UserRole } from 'common/enums/userRoles.enum';
import { canRouteClinically } from './department-access.policy';

// Enforced server-side so a hidden button in the UI is never the only guard.
export function assertCanRouteClinically(role: UserRole): void {
  if (!canRouteClinically(role)) {
    throw new ForbiddenException(
      'Only a doctor can send a patient to another department',
    );
  }
}
