import { Gender } from 'common/enums/gender.enum';
import {
  LabReferenceRange,
  LabResultData,
  LabResultField,
  LabResultFlag,
  LabResultFlags,
  LabResultSchema,
} from './result-schema.types';

export interface LabPatientContext {
  gender: Gender | null;
  ageYears: number | null;
}

const specificity = (r: LabReferenceRange) =>
  (r.sex ? 2 : 0) +
  (r.minAgeYears !== undefined || r.maxAgeYears !== undefined ? 1 : 0);

const applies = (r: LabReferenceRange, patient: LabPatientContext) => {
  if (r.sex && r.sex !== String(patient.gender)) return false;
  const age = patient.ageYears;
  if (r.minAgeYears !== undefined && (age === null || age < r.minAgeYears))
    return false;
  return !(
    r.maxAgeYears !== undefined &&
    (age === null || age >= r.maxAgeYears)
  );
};

/** The most specific interval that fits the patient's sex and age, if any. */
export function selectRange(
  ranges: LabReferenceRange[] | undefined,
  patient: LabPatientContext,
): LabReferenceRange | null {
  const fitting = (ranges ?? []).filter((r) => applies(r, patient));
  return fitting.sort((a, b) => specificity(b) - specificity(a))[0] ?? null;
}

function numericFlag(
  value: number,
  range: LabReferenceRange,
): LabResultFlag | null {
  if (range.criticalLow !== undefined && value < range.criticalLow)
    return LabResultFlag.CRITICAL_LOW;
  if (range.criticalHigh !== undefined && value > range.criticalHigh)
    return LabResultFlag.CRITICAL_HIGH;
  if (range.low !== undefined && value < range.low) return LabResultFlag.LOW;
  if (range.high !== undefined && value > range.high) return LabResultFlag.HIGH;
  return null;
}

function flagFor(
  field: LabResultField,
  value: unknown,
  patient: LabPatientContext,
): LabResultFlag | null {
  const numeric =
    typeof value === 'number' ? value : Number(String(value).trim());
  const range = selectRange(field.ranges, patient);
  if (range && Number.isFinite(numeric) && String(value).trim() !== '')
    return numericFlag(numeric, range);
  if (!field.normalValues?.length) return null;
  const normal = field.normalValues.map((v) => v.trim().toLowerCase());
  return normal.includes(String(value).trim().toLowerCase())
    ? null
    : LabResultFlag.ABNORMAL;
}

/** Flags values outside the template's reference intervals; interpretation stays with the doctor. */
export function interpretResult(
  schema: LabResultSchema,
  data: LabResultData,
  patient: LabPatientContext,
): LabResultFlags {
  return schema.fields.reduce<LabResultFlags>((flags, field) => {
    if (!(field.key in data)) return flags;
    const flag = flagFor(field, data[field.key], patient);
    return flag ? { ...flags, [field.key]: flag } : flags;
  }, {});
}
