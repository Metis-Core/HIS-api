import { containsPattern } from './like-pattern';

describe('containsPattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('wraps a plain term in wildcards', () => {
    // Arrange
    const term = 'Nakato';
    // Act
    const pattern = containsPattern(term);
    // Assert
    expect(pattern).toBe('%Nakato%');
  });

  it('escapes LIKE wildcards typed by the user', () => {
    // Arrange
    const term = '50%_a\\b';
    // Act
    const pattern = containsPattern(term);
    // Assert
    expect(pattern).toBe('%50\\%\\_a\\\\b%');
  });
});
