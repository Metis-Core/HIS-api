import type { LabReferenceRange, LabResultField } from './result-schema.types';

export const num = (
  key: string,
  label: string,
  unit: string,
  ranges: LabReferenceRange[] = [],
  extra: Partial<LabResultField> = {},
): LabResultField => ({
  key,
  label,
  type: 'number',
  unit,
  ...(ranges.length ? { ranges } : {}),
  ...extra,
});

export const pick = (
  key: string,
  label: string,
  options: string[],
  normalValues: string[] = [],
  extra: Partial<LabResultField> = {},
): LabResultField => ({
  key,
  label,
  type: 'select',
  options,
  ...(normalValues.length ? { normalValues } : {}),
  ...extra,
});

export const text = (
  key: string,
  label: string,
  extra: Partial<LabResultField> = {},
): LabResultField => ({ key, label, type: 'text', ...extra });
