// Spreadsheet apps run cells that start with these as formulas (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

export type CsvValue = string | number | boolean | null | undefined;

const cell = (value: CsvValue): string => {
  const text = value === null || value === undefined ? '' : String(value);
  const safe = FORMULA_START.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** RFC 4180 CSV with a header row; CRLF line ends so Excel opens it cleanly. */
export function toCsv<T>(
  columns: ReadonlyArray<{ header: string; value: (row: T) => CsvValue }>,
  rows: readonly T[],
): string {
  const lines = [
    columns.map((c) => cell(c.header)).join(','),
    ...rows.map((row) => columns.map((c) => cell(c.value(row))).join(',')),
  ];
  return `${lines.join('\r\n')}\r\n`;
}
