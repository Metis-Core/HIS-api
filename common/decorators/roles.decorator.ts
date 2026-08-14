import { SetMetadata } from '@nestjs/common';
import { RoleGroup } from 'common/access/role-groups';
import { UserRole } from 'common/enums/userRoles.enum';

export const ROLES_KEY = 'roles';

export type RoleSpec = UserRole | RoleGroup;

const flatten = (specs: RoleSpec[]): UserRole[] => {
  const roles = specs.flatMap((spec) =>
    typeof spec === 'string' ? [spec] : spec.roles,
  );
  return [...new Set(roles)];
};

export const Roles = (...specs: RoleSpec[]) =>
  SetMetadata(ROLES_KEY, flatten(specs));
