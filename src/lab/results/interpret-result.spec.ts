import { Gender } from 'common/enums/gender.enum';
import { interpretResult, selectRange } from './interpret-result';
import { LabResultFlag, type LabResultSchema } from './result-schema.types';

const hbRanges = [
  { low: 11, high: 16 },
  { sex: 'male' as const, minAgeYears: 18, low: 13, high: 17, criticalLow: 7 },
  {
    sex: 'female' as const,
    minAgeYears: 18,
    low: 12,
    high: 15.5,
    criticalLow: 7,
  },
  { maxAgeYears: 5, low: 10.5, high: 14 },
];
const schema: LabResultSchema = {
  fields: [
    { key: 'hb', label: 'Hb', type: 'number', ranges: hbRanges },
    {
      key: 'protein',
      label: 'Protein',
      type: 'select',
      options: ['Negative', 'Trace', '+'],
      normalValues: ['Negative'],
    },
    { key: 'note', label: 'Note', type: 'text' },
  ],
};
const man = { gender: Gender.MALE, ageYears: 40 };

describe('interpretResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('picks the most specific interval for sex and age', () => {
    // Arrange
    const child = { gender: Gender.FEMALE, ageYears: 3 };
    const unknown = { gender: null, ageYears: null };

    // Act
    const forMan = selectRange(hbRanges, man);
    const forChild = selectRange(hbRanges, child);
    const forUnknown = selectRange(hbRanges, unknown);

    // Assert
    expect(forMan).toMatchObject({ sex: 'male', low: 13 });
    expect(forChild).toMatchObject({ maxAgeYears: 5 });
    expect(forUnknown).toEqual({ low: 11, high: 16 });
  });

  it('flags low, high and critical numbers and abnormal patterns, nothing else', () => {
    // Arrange
    const data = { hb: 12, protein: 'Trace', note: 'see slide' };

    // Act
    const flags = interpretResult(schema, data, man);
    const critical = interpretResult(
      schema,
      { hb: 6.5, protein: 'negative' },
      man,
    );

    // Assert
    expect(flags).toEqual({
      hb: LabResultFlag.LOW,
      protein: LabResultFlag.ABNORMAL,
    });
    expect(critical).toEqual({ hb: LabResultFlag.CRITICAL_LOW });
  });

  it('returns no flags for values inside the interval', () => {
    // Arrange
    const data = { hb: 15, protein: 'Negative' };

    // Act
    const flags = interpretResult(schema, data, man);

    // Assert
    expect(flags).toEqual({});
  });
});
