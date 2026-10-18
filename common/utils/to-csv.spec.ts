import { toCsv } from './to-csv';

const columns = [
  { header: 'Name', value: (r: { name: string; n: number }) => r.name },
  { header: 'Count', value: (r: { name: string; n: number }) => r.n },
];

describe('toCsv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes a header and one CRLF line per row', () => {
    // Arrange
    const rows = [{ name: 'Haemoglobin', n: 3 }];

    // Act
    const csv = toCsv(columns, rows);

    // Assert
    expect(csv).toBe('Name,Count\r\nHaemoglobin,3\r\n');
  });

  it('quotes commas and quotes', () => {
    // Arrange
    const rows = [{ name: 'Urea, "BUN"', n: 1 }];

    // Act
    const csv = toCsv(columns, rows);

    // Assert
    expect(csv).toContain('"Urea, ""BUN"""');
  });

  it('defuses cells a spreadsheet would run as a formula', () => {
    // Arrange
    const rows = [{ name: '=HYPERLINK("http://x")', n: 1 }];

    // Act
    const csv = toCsv(columns, rows);

    // Assert
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
  });
});
