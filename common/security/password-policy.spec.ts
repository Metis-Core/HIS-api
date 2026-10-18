import { passwordPolicy, passwordProblems } from './password-policy';

describe('passwordPolicy', () => {
  it('defaults to ten characters', () => {
    expect(passwordPolicy({}).minLength).toBe(10);
  });

  it('follows PASSWORD_MIN_LENGTH within safe bounds', () => {
    expect(passwordPolicy({ PASSWORD_MIN_LENGTH: '12' }).minLength).toBe(12);
    expect(passwordPolicy({ PASSWORD_MIN_LENGTH: '6' }).minLength).toBe(8);
    expect(passwordPolicy({ PASSWORD_MIN_LENGTH: '99' }).minLength).toBe(32);
    expect(passwordPolicy({ PASSWORD_MIN_LENGTH: 'abc' }).minLength).toBe(10);
  });
});

describe('passwordProblems', () => {
  const policy = { minLength: 10, maxLength: 128 };

  it('accepts a strong password', () => {
    expect(passwordProblems('Suubi-clinic-2026', policy)).toEqual([]);
  });

  it('accepts the provisioning default so seeded accounts can be created', () => {
    expect(passwordProblems('ChangeMe@123', policy)).toEqual([]);
  });

  it('lists every rule that fails', () => {
    expect(passwordProblems('short', policy)).toEqual(
      expect.arrayContaining(['be at least 10 characters', 'contain a number']),
    );
  });

  it('rejects commonly used passwords even when long enough', () => {
    expect(
      passwordProblems('Password123', { ...policy, minLength: 8 }),
    ).toContain('not be a commonly used password');
  });

  it('caps the length so hashing cannot be abused', () => {
    expect(passwordProblems(`a1${'x'.repeat(200)}`, policy)).toContain(
      'be at most 128 characters',
    );
  });
});
