import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DiagnosisCode } from 'src/diagnoses/entities/diagnosis-code.entity';
import {
  BUNDLED_CATALOGUE,
  readBundledCatalogue,
} from '../seeds/icd-catalogue';
import { buildDataSourceOptions } from '../typeorm.options';

const BATCH_SIZE = 1000;
const logger = new Logger('SeedDiagnosisCodes');

// Codes moved over from the old free-text field get their catalogue entry and official title.
async function linkCarriedOverCodes(dataSource: DataSource): Promise<number> {
  const result = await dataSource.query<[unknown, number]>(
    `UPDATE "consultation_diagnoses" cd SET "diagnosisCodeId" = dc."id", "system" = dc."system", "title" = dc."title" FROM "diagnosis_codes" dc WHERE cd."diagnosisCodeId" IS NULL AND dc."system" = $1 AND dc."code" = cd."code" AND NOT EXISTS (SELECT 1 FROM "consultation_diagnoses" other WHERE other."consultationId" = cd."consultationId" AND other."system" = dc."system" AND other."code" = dc."code")`,
    [BUNDLED_CATALOGUE.system],
  );
  return result[1];
}

// Idempotent: re-running updates titles in place and never duplicates a code.
async function seed(): Promise<void> {
  const dataSource = await new DataSource(
    buildDataSourceOptions(),
  ).initialize();
  try {
    const rows = readBundledCatalogue();
    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(DiagnosisCode)
        .values(rows.slice(start, start + BATCH_SIZE))
        .orUpdate(['title'], ['system', 'code'])
        .execute();
    }
    logger.log(`Loaded ${rows.length} diagnosis codes`);
    logger.log(
      `Linked ${await linkCarriedOverCodes(dataSource)} carried-over diagnoses`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  logger.error((error as Error).message);
  process.exitCode = 1;
});
