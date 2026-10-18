import type { LabOrderItem } from 'src/lab/entities/lab-order-item.entity';
import type { Patient } from 'src/patients/entities/patient.entity';
import { describeRange } from 'src/lab/results/describe-range';
import { effectiveSchema } from 'src/lab/results/effective-schema';
import { selectRange } from 'src/lab/results/interpret-result';
import { patientContext } from 'src/lab/results/patient-context';
import { LabResultFlag } from 'src/lab/results/result-schema.types';
import { escape } from './shared';

const FLAG_LABEL: Record<LabResultFlag, string> = {
  [LabResultFlag.LOW]: 'L',
  [LabResultFlag.HIGH]: 'H',
  [LabResultFlag.CRITICAL_LOW]: 'LL',
  [LabResultFlag.CRITICAL_HIGH]: 'HH',
  [LabResultFlag.ABNORMAL]: '*',
};

const display = (value: unknown) =>
  typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);

/** One test's values as a table: field, result, flag, unit and the interval that applied. */
export function renderResultTable(
  item: LabOrderItem,
  patient: Patient | null | undefined,
): string {
  const data = item.resultData;
  if (!data || !item.test) return '<span class="muted">Pending</span>';
  const context = patientContext(patient, item.resultedAt ?? new Date());
  const rows = effectiveSchema(item.test)
    .fields.filter((field) => field.key in data)
    .map((field) => {
      const flag = item.resultFlags?.[field.key];
      const range = describeRange(selectRange(field.ranges, context));
      const normal = field.normalValues?.join(' / ') ?? '';
      return `<tr>
        <td class="cell">${escape(field.label)}</td>
        <td class="cell value">${escape(display(data[field.key]))}</td>
        <td class="cell abnormal">${flag ? FLAG_LABEL[flag] : ''}</td>
        <td class="cell">${escape(field.unit ?? '')}</td>
        <td class="cell muted">${escape(range || normal)}</td>
      </tr>`;
    })
    .join('');
  return `<table style="width:100%;border-collapse:collapse;font-size:12px"><tr><th>Parameter</th><th>Result</th><th>Flag</th><th>Unit</th><th>Reference</th></tr>${rows}</table>`;
}

export const FLAG_LEGEND =
  'Flags: L/H below/above the reference interval · LL/HH critical · * outside the normal pattern. Interpretation rests with the requesting clinician.';
