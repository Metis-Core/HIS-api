import {
  encounterChanges,
  normalizeIcdCodes,
} from './consultation-encounter.mapper';

describe('consultation encounter mapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trims text and turns an emptied field into null', () => {
    // Arrange
    const input = { plan: '  Rest  ', notes: '   ' };

    // Act
    const changes = encounterChanges(input);

    // Assert
    expect(changes).toEqual({ plan: 'Rest', notes: null });
  });

  it('leaves out fields that were not sent', () => {
    // Arrange
    const input = { diagnosis: 'Malaria' };

    // Act
    const changes = encounterChanges(input);

    // Assert
    expect(Object.keys(changes)).toEqual(['diagnosis']);
  });

  it('normalises ICD codes to upper case without blanks', () => {
    // Arrange
    const raw = ' b54, ,j06.9 ';

    // Act
    const codes = normalizeIcdCodes(raw);

    // Assert
    expect(codes).toBe('B54,J06.9');
  });
});
