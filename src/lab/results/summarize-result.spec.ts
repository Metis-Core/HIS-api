import { effectiveSchema } from './effective-schema';
import { summarizeResult } from './summarize-result';

describe('summarizeResult / effectiveSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gives template-less tests a single Result field carrying the test unit', () => {
    // Arrange
    const test = { resultSchema: null, unit: 'mmol/L' };

    // Act
    const schema = effectiveSchema(test);

    // Assert
    expect(schema.fields).toEqual([
      { key: 'value', label: 'Result', type: 'text', unit: 'mmol/L' },
    ]);
  });

  it('summarises template values with labels and units', () => {
    // Arrange
    const test = {
      resultSchema: {
        fields: [
          { key: 'hb', label: 'Hb', type: 'number' as const, unit: 'g/dL' },
          { key: 'seen', label: 'Seen', type: 'boolean' as const },
        ],
      },
    };

    // Act
    const text = summarizeResult(test, { hb: 12.1, seen: true });
    const plain = summarizeResult({ unit: 'mmol/L' }, { value: '5.4' });

    // Assert
    expect(text).toBe('Hb: 12.1 g/dL; Seen: Yes');
    expect(plain).toBe('5.4 mmol/L');
  });
});
