import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DiagnosisCodeSystem } from 'src/diagnoses/enums/diagnosis-code-system.enum';

export interface CatalogueRow {
  system: DiagnosisCodeSystem;
  code: string;
  title: string;
}

/** The bundled catalogue: ICD-10-CM FY2026, 3- and 4-character categories (see README.md). */
export const BUNDLED_CATALOGUE = {
  system: DiagnosisCodeSystem.ICD10_CM,
  file: join(__dirname, 'icd10cm-2026-categories.tsv'),
};

/** Parses `code<TAB>title` lines, skipping blanks and malformed lines. */
export function parseCatalogue(
  text: string,
  system: DiagnosisCodeSystem,
): CatalogueRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.split('\t'))
    .filter(([code, title]) => Boolean(code?.trim() && title?.trim()))
    .map(([code, title]) => ({
      system,
      code: code.trim().toUpperCase(),
      title: title.trim(),
    }));
}

export function readBundledCatalogue(): CatalogueRow[] {
  return parseCatalogue(
    readFileSync(BUNDLED_CATALOGUE.file, 'utf8'),
    BUNDLED_CATALOGUE.system,
  );
}
