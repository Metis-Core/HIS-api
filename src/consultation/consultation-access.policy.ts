import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { UserRole } from 'common/enums/userRoles.enum';

/** The signed-in user acting on a consultation. */
export interface ConsultationActor {
  id: string;
  role: UserRole;
}

export const isConsultationAdmin = (role: UserRole): boolean =>
  RoleGroups.ADMINS.roles.includes(role);

// M-11: the record belongs to its doctor; admins may step in (e.g. a doctor who has left).
export function assertCanEditConsultation(
  consultation: { doctorId: string },
  actor: ConsultationActor,
): void {
  if (isConsultationAdmin(actor.role)) return;
  if (consultation.doctorId === actor.id) return;
  throw new ForbiddenException(
    'Only the assigned doctor or an administrator can change this consultation',
  );
}

export function assertCanAssignDoctor(
  doctorId: string,
  actor: ConsultationActor,
): void {
  if (doctorId === actor.id || isConsultationAdmin(actor.role)) return;
  throw new ForbiddenException(
    'Only an administrator can assign a consultation to another doctor',
  );
}

export function assertIsDoctor(user: { role: UserRole }): void {
  if (user.role === UserRole.DOCTOR) return;
  throw new BadRequestException(
    'The assigned doctor must be a user with the doctor role',
  );
}
