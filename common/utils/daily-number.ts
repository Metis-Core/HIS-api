const pad = (value: number): string => String(value).padStart(3, '0');

export const dailyNumberPrefix = (code: string, businessDate: string): string =>
  `${code}-${businessDate.replaceAll('-', '')}-`;

export function nextDailyNumber(
  code: string,
  businessDate: string,
  lastToday: string | null,
): string {
  const prefix = dailyNumberPrefix(code, businessDate);
  const last = lastToday?.startsWith(prefix)
    ? Number(lastToday.slice(prefix.length))
    : 0;
  return `${prefix}${pad((Number.isFinite(last) ? last : 0) + 1)}`;
}
