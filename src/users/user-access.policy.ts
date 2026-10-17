import { ForbiddenException } from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { UserRole } from 'common/enums/userRoles.enum';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import type { UpdateUserDto } from './dto/update-user.dto';

type Actor = Pick<AuthenticatedUser, 'id' | 'role'>;
type Target = { id: string; role: UserRole };

export const isAdmin = (actor: Actor): boolean =>
  RoleGroups.ADMINS.roles.includes(actor.role);

export function assertCanView(actor: Actor, targetId: string): void {
  if (actor.id === targetId || isAdmin(actor)) return;
  throw new ForbiddenException('You can only view your own account');
}

export function assertCanManage(
  actor: Actor,
  target: Target,
  dto: UpdateUserDto = {},
): void {
  if (!isAdmin(actor)) {
    throw new ForbiddenException(
      'Only administrators can manage user accounts',
    );
  }
  const touchesSuperAdmin =
    target.role === UserRole.SUPER_ADMIN || dto.role === UserRole.SUPER_ADMIN;
  if (touchesSuperAdmin && actor.role !== UserRole.SUPER_ADMIN) {
    throw new ForbiddenException(
      'Only a super admin can manage super admin accounts',
    );
  }
  const selfEscalation =
    actor.id === target.id &&
    (dto.role !== undefined || dto.status !== undefined);
  if (selfEscalation) {
    throw new ForbiddenException('You cannot change your own role or status');
  }
}

export function assertCanDelete(actor: Actor, target: Target): void {
  if (actor.id === target.id) {
    throw new ForbiddenException('You cannot delete your own account');
  }
  assertCanManage(actor, target);
}
