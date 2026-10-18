import { effectiveSchema } from './effective-schema';
import type { LabResultData, LabResultSchema } from './result-schema.types';

const display = (value: unknown) =>
  typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);

/** One-line "Hb: 12.1 g/dL; WBC: 6.2" summary for compact documents. */
export function summarizeResult(
  test:
    | { resultSchema?: LabResultSchema | null; unit?: string | null }
    | null
    | undefined,
  data: LabResultData | null | undefined,
): string {
  if (!data || !test) return '';
  return effectiveSchema(test)
    .fields.filter((f) => f.key in data)
    .map((f) => {
      const value = [display(data[f.key]), f.unit].filter(Boolean).join(' ');
      return f.key === 'value' && f.label === 'Result'
        ? value
        : `${f.label}: ${value}`;
    })
    .join('; ');
}
