import { UserRole } from 'common/enums/userRoles.enum';

/** Which patients a role may list or open (R8: staff see only the patients their work involves). */
export enum PatientScope {
  ALL = 'all',
  LAB = 'lab',
  PHARMACY = 'pharmacy',
  BILLING = 'billing',
}

export function patientScopeFor(role: UserRole): PatientScope {
  switch (role) {
    case UserRole.LAB_TECH:
      return PatientScope.LAB;
    case UserRole.PHARMACIST:
      return PatientScope.PHARMACY;
    case UserRole.ACCOUNTANT:
      return PatientScope.BILLING;
    default:
      return PatientScope.ALL;
  }
}

// Table names are fixed literals here, never user input.
const SCOPE_EXISTS: Record<Exclude<PatientScope, PatientScope.ALL>, string> = {
  [PatientScope.LAB]: `EXISTS (SELECT 1 FROM "lab_orders" scoped WHERE scoped."patientId" = patient.id AND scoped."deletedAt" IS NULL)`,
  [PatientScope.PHARMACY]: `EXISTS (SELECT 1 FROM "prescriptions" scoped WHERE scoped."patientId" = patient.id AND scoped."deletedAt" IS NULL)`,
  [PatientScope.BILLING]: `EXISTS (SELECT 1 FROM "visits" scoped WHERE scoped."patientId" = patient.id AND scoped."deletedAt" IS NULL)`,
};

/** SQL condition on alias `patient`, or null when the scope sees everyone. */
export function scopeCondition(scope: PatientScope): string | null {
  return scope === PatientScope.ALL ? null : SCOPE_EXISTS[scope];
}
