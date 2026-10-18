import { UserRole } from 'common/enums/userRoles.enum';

export interface RoleGroup {
  readonly description: string;
  readonly roles: readonly UserRole[];
}

const define = (
  description: string,
  roles: readonly UserRole[],
): RoleGroup => ({ description, roles });

export const RoleGroups = {
  ADMINS: define(
    'System administrators with full platform management access.',
    [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  ),

  PROVIDERS: define(
    'Licensed providers who diagnose, prescribe and own consultations.',
    [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR],
  ),

  CLINICAL_STAFF: define(
    'Doctors and nurses delivering direct clinical care.',
    [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE],
  ),

  FRONT_DESK_CLINICAL: define(
    'Clinical staff plus reception handling intake and patient records.',
    [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
    ],
  ),

  FLOOR_STAFF: define(
    'All on-floor staff operating the patient queue and display boards.',
    [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
      UserRole.LAB_TECH,
      UserRole.PHARMACIST,
      UserRole.ACCOUNTANT,
    ],
  ),

  CLINICAL_ROUTERS: define(
    'Doctors, the only staff who may route a patient to lab, radiology, pharmacy or surgery.',
    [UserRole.DOCTOR],
  ),

  RECEPTION: define(
    'Administrators and reception managing check-in and cancellations.',
    [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST],
  ),

  CHECK_IN_STAFF: define(
    'Staff permitted to check patients in and open visits.',
    [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.RECEPTIONIST,
      UserRole.NURSE,
    ],
  ),

  PRIORITY_MANAGERS: define('Staff permitted to adjust visit priority.', [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.NURSE,
    UserRole.DOCTOR,
  ]),

  NURSING_ADMIN: define('Administrators and nurses managing triage records.', [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.NURSE,
  ]),

  LAB_ORDERERS: define(
    'Staff who may raise a lab order: providers, plus the lab and reception for walk-ins.',
    [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.DOCTOR,
      UserRole.LAB_TECH,
      UserRole.RECEPTIONIST,
    ],
  ),

  LAB_INTAKE: define(
    'Staff who may open a lab-only visit for a walk-in with no consultation.',
    [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.RECEPTIONIST,
      UserRole.LAB_TECH,
    ],
  ),

  FINANCE_MANAGERS: define(
    'Staff who may void payments, close out the day and review the ledger.',
    [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT],
  ),

  BILLING: define('Staff permitted to settle or waive visit charges.', [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.ACCOUNTANT,
    UserRole.RECEPTIONIST,
  ]),
} as const satisfies Record<string, RoleGroup>;

export type RoleGroupName = keyof typeof RoleGroups;
