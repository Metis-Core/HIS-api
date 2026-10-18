import { Department } from 'common/enums/department.enum';
import { VisitIntenentsEnum } from '../enums/visit-type.enum';
import { intentDepartmentMap } from '../intent-department.map';

export interface PlannedStage {
  intent: VisitIntenentsEnum;
  /** A second doctor visit to review diagnostic results. */
  review?: boolean;
}

export const DIAGNOSTIC_INTENTS: readonly VisitIntenentsEnum[] = [
  VisitIntenentsEnum.LAB,
  VisitIntenentsEnum.RADIOLOGY,
];

const DIAGNOSTIC_DEPARTMENTS = DIAGNOSTIC_INTENTS.map(
  (intent) => intentDepartmentMap[intent],
);

/**
 * Orders the stages a doctor requests into the real journey:
 * diagnostics -> doctor review -> treatment -> billing.
 * `openDepartments` are departments that already have an open entry for the visit
 * (excluding the doctor entry being completed), so nothing is queued twice.
 */
export function planDoctorRouting(
  requested: readonly VisitIntenentsEnum[],
  openDepartments: readonly Department[],
): PlannedStage[] {
  const isOpen = (intent: VisitIntenentsEnum) =>
    openDepartments.includes(intentDepartmentMap[intent]);
  const admit =
    requested.includes(VisitIntenentsEnum.ADMISSION) &&
    !isOpen(VisitIntenentsEnum.ADMISSION);
  const unique = [...new Set(requested)].filter(
    (intent) =>
      intent !== VisitIntenentsEnum.BILLING &&
      intent !== VisitIntenentsEnum.ADMISSION,
  );

  const diagnostics = unique.filter(
    (intent) => DIAGNOSTIC_INTENTS.includes(intent) && !isOpen(intent),
  );
  const treatments = unique.filter(
    (intent) => !DIAGNOSTIC_INTENTS.includes(intent) && !isOpen(intent),
  );
  const awaitingResults =
    diagnostics.length > 0 ||
    openDepartments.some((department) =>
      DIAGNOSTIC_DEPARTMENTS.includes(department),
    );

  const plan: PlannedStage[] = diagnostics.map((intent) => ({ intent }));
  if (awaitingResults && !isOpen(VisitIntenentsEnum.CONSULTATION)) {
    plan.push({ intent: VisitIntenentsEnum.CONSULTATION, review: true });
  }
  plan.push(...treatments.map((intent) => ({ intent })));
  // Billing closes the visit only once no doctor review is still pending.
  if (!awaitingResults && !isOpen(VisitIntenentsEnum.BILLING)) {
    plan.push({ intent: VisitIntenentsEnum.BILLING });
  }
  // D6: an admitted patient goes to the ward first; the rest of the plan follows from there.
  return admit ? [{ intent: VisitIntenentsEnum.ADMISSION }, ...plan] : plan;
}
