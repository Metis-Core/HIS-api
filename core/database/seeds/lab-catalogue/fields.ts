import type { LabSampleType } from 'src/lab/enums/lab-sample-type.enum';
import type { LabTestCategory } from 'src/lab/enums/lab-test-category.enum';
import type {
  LabReferenceRange,
  LabResultField,
} from 'src/lab/results/result-schema.types';

export interface SeedLabTest {
  code: string;
  abbreviation?: string;
  name: string;
  category: LabTestCategory;
  sampleType: LabSampleType;
  unit?: string;
  // Placeholder (UGX) until Suubi confirms its price list.
  price: number;
  turnaroundHours?: number;
  description?: string;
  fields: LabResultField[];
}

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

export const NEG_POS = ['Negative', 'Positive'];
export const NONREACTIVE = ['Non-reactive', 'Reactive'];
export const SEEN = ['Not seen', 'Seen'];
export const AMOUNT = ['None', 'Few', 'Moderate', 'Many'];
export const DIPSTICK = ['Negative', 'Trace', '+', '++', '+++'];

/** A single required qualitative answer where the first option is the normal one. */
export const qualitative = (
  label: string,
  options: string[],
): LabResultField[] => [
  pick('result', label, options, [options[0]], { required: true }),
];

export const adult = (
  low: number,
  high: number,
  extra: LabReferenceRange = {},
) => ({
  minAgeYears: 18,
  low,
  high,
  ...extra,
});
export const male = (
  low: number,
  high: number,
  extra: LabReferenceRange = {},
) => ({
  sex: 'male' as const,
  minAgeYears: 18,
  low,
  high,
  ...extra,
});
export const female = (
  low: number,
  high: number,
  extra: LabReferenceRange = {},
) => ({
  sex: 'female' as const,
  minAgeYears: 18,
  low,
  high,
  ...extra,
});
export const underFive = (
  low: number,
  high: number,
  extra: LabReferenceRange = {},
) => ({
  maxAgeYears: 5,
  low,
  high,
  ...extra,
});
