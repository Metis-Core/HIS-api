import { DiagnosisCodeSystem } from 'src/diagnoses/enums/diagnosis-code-system.enum';
import { parseCatalogue, readBundledCatalogue } from './icd-catalogue';

describe('ICD catalogue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses code and title pairs and skips malformed lines', () => {
    // Arrange
    const text =
      'b54\tUnspecified malaria\r\n\nbroken line\nJ06.9\tAcute upper respiratory infection, unspecified\n';

    // Act
    const rows = parseCatalogue(text, DiagnosisCodeSystem.ICD10_CM);

    // Assert
    expect(rows).toEqual([
      { system: 'ICD-10-CM', code: 'B54', title: 'Unspecified malaria' },
      {
        system: 'ICD-10-CM',
        code: 'J06.9',
        title: 'Acute upper respiratory infection, unspecified',
      },
    ]);
  });

  it('bundles unique codes including common local diagnoses', () => {
    // Arrange
    const rows = readBundledCatalogue();

    // Act
    const codes = new Set(rows.map((row) => row.code));

    // Assert
    expect(codes.size).toBe(rows.length);
    ['B50.9', 'B54', 'A01.0', 'J18.9', 'E11.9', 'I10', 'O80'].forEach((code) =>
      expect(codes.has(code)).toBe(true),
    );
  });
});
