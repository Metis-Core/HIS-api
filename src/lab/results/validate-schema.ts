import { BadRequestException } from '@nestjs/common';
import type { LabReferenceRange, LabResultSchema } from './result-schema.types';

const outOfOrder = (a?: number, b?: number) =>
  a !== undefined && b !== undefined && a > b;

function rangeProblems(label: string, r: LabReferenceRange): string[] {
  const problems: string[] = [];
  if (outOfOrder(r.low, r.high)) problems.push(`${label}: low is above high`);
  if (outOfOrder(r.criticalLow, r.low))
    problems.push(`${label}: critical low is above low`);
  if (outOfOrder(r.high, r.criticalHigh))
    problems.push(`${label}: critical high is below high`);
  if (
    outOfOrder(r.minAgeYears, r.maxAgeYears) ||
    (r.minAgeYears !== undefined && r.minAgeYears === r.maxAgeYears)
  ) {
    problems.push(`${label}: minimum age must be below maximum age`);
  }
  return problems;
}

/** Rejects templates whose keys repeat, selects lack options or intervals contradict themselves. */
export function assertValidSchema(
  schema: LabResultSchema | null | undefined,
): void {
  if (!schema) return;
  const keys = schema.fields.map((f) => f.key);
  const problems = keys
    .filter((key, i) => keys.indexOf(key) !== i)
    .map((key) => `Field key "${key}" is used twice`);
  schema.fields.forEach((field) => {
    if (field.type === 'select' && !field.options?.length) {
      problems.push(`${field.label}: a select field needs options`);
    }
    (field.ranges ?? []).forEach((range) =>
      problems.push(...rangeProblems(field.label, range)),
    );
  });
  if (problems.length) throw new BadRequestException(problems);
}
