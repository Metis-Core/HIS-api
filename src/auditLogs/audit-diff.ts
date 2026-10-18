import type { AuditChanges } from './entities/audit-log.entity';

export const REDACTED = '[redacted]';

// Values never copied into the audit trail; only the fact that they changed is kept.
const SENSITIVE_KEYS = new Set([
  'passwordHash',
  'password',
  'token',
  'tokenHash',
  'refreshToken',
  'code',
  'codeHash',
]);

// Bookkeeping columns that change on every write and would only add noise.
const IGNORED_KEYS = new Set(['updatedAt', 'createdAt', 'deletedAt']);

const toAuditValue = (key: string, value: unknown): unknown => {
  if (SENSITIVE_KEYS.has(key)) return REDACTED;
  if (value instanceof Date) return value.toISOString();
  return value;
};

// Column-level snapshot (callers pass the entity's column names, so relations are excluded).
export function snapshot(
  entity: Record<string, unknown> | undefined,
  columns: readonly string[],
): Record<string, unknown> {
  if (!entity) return {};
  return Object.fromEntries(
    columns
      .filter((key) => !IGNORED_KEYS.has(key) && entity[key] !== undefined)
      .map((key) => [key, toAuditValue(key, entity[key])]),
  );
}

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a instanceof Date ? a.toISOString() : a) ===
  JSON.stringify(b instanceof Date ? b.toISOString() : b);

// Only the properties that actually changed, as before/after pairs.
export function diff(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined,
  keys: readonly string[],
): AuditChanges | null {
  const changed = keys.filter(
    (key) => !IGNORED_KEYS.has(key) && !same(before?.[key], after?.[key]),
  );
  if (changed.length === 0) return null;
  const pick = (source?: Record<string, unknown>) =>
    Object.fromEntries(
      changed.map((key) => [key, toAuditValue(key, source?.[key] ?? null)]),
    );
  return { before: pick(before), after: pick(after) };
}
