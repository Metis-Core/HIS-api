import type { LabReferenceRange } from './result-schema.types';

/** Human-readable interval such as "4.0 – 11.0", "< 5" or "> 1.2" for reports. */
export function describeRange(
  range: LabReferenceRange | null | undefined,
): string {
  if (!range) return '';
  const { low, high } = range;
  if (low !== undefined && high !== undefined) return `${low} – ${high}`;
  if (high !== undefined) return `≤ ${high}`;
  if (low !== undefined) return `≥ ${low}`;
  return '';
}
