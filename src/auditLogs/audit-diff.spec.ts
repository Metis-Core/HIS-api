import { diff, REDACTED, snapshot } from './audit-diff';

describe('audit diff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('snapshots the given columns, redacting secrets and dropping timestamps', () => {
    // Arrange
    const entity = {
      id: 'u1',
      username: 'nurse',
      passwordHash: 'argon2-hash',
      createdAt: new Date('2026-10-18T00:00:00Z'),
      contact: { id: 'c1' },
      dateOfBirth: new Date('1990-01-01T00:00:00Z'),
    };
    const columns = [
      'id',
      'username',
      'passwordHash',
      'createdAt',
      'dateOfBirth',
      'email',
    ];
    // Act
    const result = snapshot(entity, columns);
    // Assert
    expect(result).toEqual({
      id: 'u1',
      username: 'nurse',
      passwordHash: REDACTED,
      dateOfBirth: '1990-01-01T00:00:00.000Z',
    });
  });

  it('returns only the changed keys as before/after pairs', () => {
    // Arrange
    const before = { status: 'active', role: 'nurse', updatedAt: 1 };
    const after = { status: 'suspended', role: 'nurse', updatedAt: 2 };
    // Act
    const result = diff(before, after, ['status', 'role', 'updatedAt']);
    // Assert
    expect(result).toEqual({
      before: { status: 'active' },
      after: { status: 'suspended' },
    });
  });

  it('records that a secret changed without storing either value', () => {
    // Arrange
    const before = { passwordHash: 'old' };
    const after = { passwordHash: 'new' };
    // Act
    const result = diff(before, after, ['passwordHash']);
    // Assert
    expect(result).toEqual({
      before: { passwordHash: REDACTED },
      after: { passwordHash: REDACTED },
    });
  });

  it('returns null when nothing changed', () => {
    // Arrange
    const when = new Date('2026-10-18T00:00:00Z');
    // Act
    const result = diff({ at: when }, { at: new Date(when) }, ['at']);
    // Assert
    expect(result).toBeNull();
  });
});
