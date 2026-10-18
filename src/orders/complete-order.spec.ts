import { BadRequestException } from '@nestjs/common';
import type { LabResultSchema } from 'src/lab/results/result-schema.types';
import { buildCompletion } from './complete-order';
import { OrderKind } from './enums/order-kind.enum';
import { ResultClassification } from './enums/result-classification.enum';

const schema: LabResultSchema = {
  fields: [
    {
      key: 'lungs',
      label: 'Lungs',
      type: 'select',
      options: ['Clear', 'Consolidation'],
      normalValues: ['Clear'],
      required: true,
    },
    {
      key: 'rate',
      label: 'Heart rate',
      type: 'number',
      unit: 'bpm',
      ranges: [{ low: 60, high: 100, criticalLow: 40, criticalHigh: 150 }],
    },
  ],
};
const patient = { gender: null, ageYears: 30 };
const base = { kind: OrderKind.RADIOLOGY, schema, patient };

describe('buildCompletion', () => {
  it('keeps a clean normal study and flags nothing', () => {
    const done = buildCompletion({
      ...base,
      resultData: { lungs: 'Clear' },
      classification: ResultClassification.NORMAL,
      impression: 'No acute disease',
    });
    expect(done.resultFlags).toEqual({});
    expect(done.classification).toBe(ResultClassification.NORMAL);
  });

  it('flags findings outside the normal pattern and refuses to call them normal', () => {
    const input = {
      ...base,
      resultData: { lungs: 'Consolidation' },
      impression: 'Right lower lobe consolidation',
    };
    expect(() =>
      buildCompletion({
        ...input,
        classification: ResultClassification.NORMAL,
      }),
    ).toThrow(BadRequestException);
    const done = buildCompletion({
      ...input,
      classification: ResultClassification.ABNORMAL,
    });
    expect(done.resultFlags).toEqual({ lungs: 'abnormal' });
  });

  it('requires the critical class when a critical value is entered', () => {
    const input = {
      ...base,
      resultData: { lungs: 'Clear', rate: 170 },
      impression: 'Fast rhythm',
    };
    expect(() =>
      buildCompletion({
        ...input,
        classification: ResultClassification.ABNORMAL,
      }),
    ).toThrow(BadRequestException);
    expect(
      buildCompletion({
        ...input,
        classification: ResultClassification.CRITICAL,
      }).resultFlags,
    ).toMatchObject({
      rate: 'critical_high',
    });
  });

  it('needs an impression and a classification for imaging', () => {
    expect(() =>
      buildCompletion({
        ...base,
        resultData: { lungs: 'Clear' },
        classification: ResultClassification.NORMAL,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      buildCompletion({
        ...base,
        resultData: { lungs: 'Clear' },
        impression: 'Normal',
      }),
    ).toThrow(BadRequestException);
  });

  it('requires the required template fields', () => {
    expect(() =>
      buildCompletion({
        ...base,
        resultData: {},
        classification: ResultClassification.NORMAL,
        impression: 'Normal',
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts a procedure with notes only and no classification', () => {
    const done = buildCompletion({
      kind: OrderKind.SURGERY,
      schema: null,
      patient,
      report: 'Wound dressed, no complications',
    });
    expect(done.classification).toBeNull();
    expect(done.report).toBe('Wound dressed, no complications');
  });

  it('asks for notes when a procedure has no template and no notes', () => {
    expect(() =>
      buildCompletion({ kind: OrderKind.SURGERY, schema: null, patient }),
    ).toThrow(BadRequestException);
  });
});
