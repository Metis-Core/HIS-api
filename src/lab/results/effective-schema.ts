import type { LabResultSchema } from './result-schema.types';

export const PLAIN_RESULT_KEY = 'value';

/** Tests without a template take a single free-text "Result" field, so every result is structured. */
export function effectiveSchema(test: {
  resultSchema?: LabResultSchema | null;
  unit?: string | null;
}): LabResultSchema {
  if (test.resultSchema?.fields?.length) return test.resultSchema;
  return {
    fields: [
      {
        key: PLAIN_RESULT_KEY,
        label: 'Result',
        type: 'text',
        ...(test.unit ? { unit: test.unit } : {}),
      },
    ],
  };
}
