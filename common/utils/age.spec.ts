import { ageInYears } from './age';

describe('ageInYears', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('counts whole years and handles the day before a birthday', () => {
    // Arrange
    const at = new Date('2026-10-18T12:00:00Z');

    // Act
    const onBirthday = ageInYears('1990-10-18', at);
    const dayBefore = ageInYears('1990-10-19', at);

    // Assert
    expect(onBirthday).toBe(36);
    expect(dayBefore).toBe(35);
  });

  it('returns null for missing, invalid or future dates', () => {
    // Arrange
    const at = new Date('2026-10-18T12:00:00Z');

    // Act / Assert
    expect(ageInYears(null, at)).toBeNull();
    expect(ageInYears('not-a-date', at)).toBeNull();
    expect(ageInYears('2030-01-01', at)).toBeNull();
  });
});
