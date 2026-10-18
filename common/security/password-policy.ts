const DEFAULT_MIN_LENGTH = 10;
const LOWEST_MIN_LENGTH = 8;
const HIGHEST_MIN_LENGTH = 32;

export const PASSWORD_MAX_LENGTH = 128;

const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyuiop',
  'iloveyou1',
  'welcome123',
  'admin12345',
  'letmein123',
]);

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
}

export function passwordPolicy(
  env: Record<string, string | undefined> = process.env,
): PasswordPolicy {
  const configured = Number.parseInt(env.PASSWORD_MIN_LENGTH ?? '', 10);
  const minLength = Number.isFinite(configured)
    ? Math.min(Math.max(configured, LOWEST_MIN_LENGTH), HIGHEST_MIN_LENGTH)
    : DEFAULT_MIN_LENGTH;
  return { minLength, maxLength: PASSWORD_MAX_LENGTH };
}

export function passwordProblems(
  password: string,
  policy: PasswordPolicy = passwordPolicy(),
): string[] {
  const problems: string[] = [];
  if (password.length < policy.minLength) {
    problems.push(`be at least ${policy.minLength} characters`);
  }
  if (password.length > policy.maxLength) {
    problems.push(`be at most ${policy.maxLength} characters`);
  }
  if (!/[A-Za-z]/.test(password)) problems.push('contain a letter');
  if (!/\d/.test(password)) problems.push('contain a number');
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    problems.push('not be a commonly used password');
  }
  return problems;
}
