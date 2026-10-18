import { BadRequestException } from '@nestjs/common';
import type {
  LabResultData,
  LabResultField,
  LabResultSchema,
  LabResultValue,
} from './result-schema.types';

const MAX_TEXT_LENGTH = 500;

const isEmpty = (value: unknown) =>
  value === null || value === undefined || value === '';

function fieldProblem(field: LabResultField, value: unknown): string | null {
  switch (field.type) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
        ? null
        : 'must be a number';
    case 'boolean':
      return typeof value === 'boolean' ? null : 'must be true or false';
    case 'select':
      return typeof value === 'string' && (field.options ?? []).includes(value)
        ? null
        : `must be one of: ${(field.options ?? []).join(', ')}`;
    default:
      if (typeof value !== 'string') return 'must be text';
      return value.length > MAX_TEXT_LENGTH
        ? `must be at most ${MAX_TEXT_LENGTH} characters`
        : null;
  }
}

/** Checks result values against the test's template; returns them without empty entries. */
export function validateResultData(
  schema: LabResultSchema,
  data: unknown,
  { requireComplete }: { requireComplete: boolean },
): LabResultData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new BadRequestException(
      'resultData must be an object of field values',
    );
  }
  const fields = new Map(schema.fields.map((f) => [f.key, f]));
  const entries = Object.entries(data as Record<string, unknown>);
  const problems = entries
    .filter(([key]) => !fields.has(key))
    .map(([key]) => `${key} is not a field of this test`);

  const clean: LabResultData = {};
  entries
    .filter(([key, value]) => fields.has(key) && !isEmpty(value))
    .forEach(([key, value]) => {
      const field = fields.get(key) as LabResultField;
      const problem = fieldProblem(field, value);
      if (problem) problems.push(`${field.label} ${problem}`);
      else
        clean[key] =
          typeof value === 'string' ? value.trim() : (value as LabResultValue);
    });

  if (requireComplete) {
    schema.fields
      .filter((f) => f.required && isEmpty(clean[f.key]))
      .forEach((f) => problems.push(`${f.label} is required`));
    if (Object.keys(clean).length === 0 && !problems.length)
      problems.push('Enter at least one result value');
  }
  if (problems.length) throw new BadRequestException(problems);
  return clean;
}
