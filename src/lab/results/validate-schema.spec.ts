import { BadRequestException } from '@nestjs/common';
import { assertValidSchema } from './validate-schema';

describe('assertValidSchema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts a consistent template and an empty one', () => {
    // Arrange
    const schema = {
      fields: [
        {
          key: 'hb',
          label: 'Hb',
          type: 'number' as const,
          ranges: [{ low: 1, high: 2, criticalLow: 0.5 }],
        },
      ],
    };

    // Act / Assert
    expect(() => assertValidSchema(schema)).not.toThrow();
    expect(() => assertValidSchema(null)).not.toThrow();
  });

  it('rejects repeated keys, option-less selects and contradictory intervals', () => {
    // Arrange
    const schema = {
      fields: [
        {
          key: 'a',
          label: 'A',
          type: 'number' as const,
          ranges: [
            { low: 5, high: 2 },
            { minAgeYears: 5, maxAgeYears: 5 },
          ],
        },
        { key: 'a', label: 'A2', type: 'select' as const },
      ],
    };

    // Act
    let problems: string[] = [];
    try {
      assertValidSchema(schema);
    } catch (error) {
      problems = (error as BadRequestException).getResponse()[
        'message'
      ] as string[];
    }

    // Assert
    expect(problems).toEqual([
      'Field key "a" is used twice',
      'A: low is above high',
      'A: minimum age must be below maximum age',
      'A2: a select field needs options',
    ]);
  });
});
