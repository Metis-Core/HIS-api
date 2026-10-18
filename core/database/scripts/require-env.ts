export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set in the environment`);
  }
  return value;
}
