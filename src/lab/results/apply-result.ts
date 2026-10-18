import type { LabOrderItem } from '../entities/lab-order-item.entity';
import type { LabTest } from '../entities/lab-test.entity';
import { effectiveSchema } from './effective-schema';
import { interpretResult, LabPatientContext } from './interpret-result';
import { validateResultData } from './validate-result-data';

/** Validates new values against the template and recomputes the out-of-range flags. */
export function applyResultData(
  item: LabOrderItem,
  test: LabTest,
  data: unknown,
  patient: LabPatientContext,
  requireComplete: boolean,
): void {
  const schema = effectiveSchema(test);
  const clean = validateResultData(schema, data, { requireComplete });
  const flags = interpretResult(schema, clean, patient);
  item.resultData = Object.keys(clean).length ? clean : null;
  item.resultFlags = Object.keys(flags).length ? flags : null;
  item.isAbnormal = Object.keys(flags).length > 0;
}
