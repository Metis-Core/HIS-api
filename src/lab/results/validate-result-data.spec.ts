import { BadRequestException } from '@nestjs/common';
import type { LabResultSchema } from './result-schema.types';
import { validateResultData } from './validate-result-data';

const schema: LabResultSchema = {
  fields: [
    { key: 'hb', label: 'Haemoglobin', type: 'number', required: true },
    {
      key: 'colour',
      label: 'Colour',
      type: 'select',
      options: ['Yellow', 'Amber'],
    },
    { key: 'seen', label: 'Parasites seen', type: 'boolean' },
    { key: 'note', label: 'Comment', type: 'text' },
  ],
};

const problemsOf = (run: () => unknown): string[] => {
  try {
    run();
  } catch (error) {
    return (error as BadRequestException).getResponse()['message'] as string[];
  }
  return [];
};

describe('validateResultData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps valid values, trims text and drops empty entries', () => {
    // Arrange
    const data = { hb: 12.5, colour: 'Amber', seen: false, note: '  ok ' };

    // Act
    const clean = validateResultData(schema, data, { requireComplete: true });

    // Assert
    expect(clean).toEqual({
      hb: 12.5,
      colour: 'Amber',
      seen: false,
      note: 'ok',
    });
  });

  it('rejects unknown keys, wrong types and options outside the list', () => {
    // Arrange
    const data = { hb: '12', colour: 'Green', seen: 'yes', bogus: 1 };

    // Act
    const problems = problemsOf(() =>
      validateResultData(schema, data, { requireComplete: false }),
    );

    // Assert
    expect(problems).toEqual(
      expect.arrayContaining([
        'bogus is not a field of this test',
        'Haemoglobin must be a number',
        'Colour must be one of: Yellow, Amber',
        'Parasites seen must be true or false',
      ]),
    );
  });

  it('requires mandatory fields only when the result is being completed', () => {
    // Arrange
    const draft = { colour: 'Yellow' };

    // Act
    const asDraft = problemsOf(() =>
      validateResultData(schema, draft, { requireComplete: false }),
    );
    const asFinal = problemsOf(() =>
      validateResultData(schema, draft, { requireComplete: true }),
    );

    // Assert
    expect(asDraft).toEqual([]);
    expect(asFinal).toEqual(['Haemoglobin is required']);
  });

  it('rejects arrays and non-objects', () => {
    // Arrange
    const run = () =>
      validateResultData(schema, [1, 2], { requireComplete: false });

    // Act / Assert
    expect(run).toThrow(BadRequestException);
  });
});
