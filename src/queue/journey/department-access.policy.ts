import { Department } from 'common/enums/department.enum';
import { UserRole } from 'common/enums/userRoles.enum';

const ALWAYS_ALLOWED: readonly UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
];

const CLINICAL: readonly UserRole[] = [UserRole.DOCTOR, UserRole.NURSE];

// Which roles may call/start/complete/skip a patient in each department's queue.
const STAGE_ROLES: Record<Department, readonly UserRole[]> = {
  [Department.RECEPTION]: [UserRole.RECEPTIONIST],
  [Department.TRIAGE]: CLINICAL,
  [Department.OUTPATIENT_CLINIC]: CLINICAL,
  [Department.INPATIENT_WARD]: CLINICAL,
  [Department.DENTAL]: CLINICAL,
  [Department.ANTENATAL]: CLINICAL,
  [Department.MAIN_LABORATORY]: [UserRole.LAB_TECH],
  [Department.RADIOLOGY]: [...CLINICAL, UserRole.LAB_TECH],
  [Department.MAIN_PHARMACY]: [UserRole.PHARMACIST],
  [Department.FINANCE]: [UserRole.ACCOUNTANT, UserRole.RECEPTIONIST],
  [Department.ADMINISTRATION]: [],
};

export function canActOnStage(role: UserRole, department: Department): boolean {
  return (
    ALWAYS_ALLOWED.includes(role) ||
    (STAGE_ROLES[department] ?? []).includes(role)
  );
}

/** Only a doctor may send a patient to lab, radiology, pharmacy, surgery and so on. */
export function canRouteClinically(role: UserRole): boolean {
  return role === UserRole.DOCTOR;
}
