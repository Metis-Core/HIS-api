import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DiagnosisCode } from 'src/diagnoses/entities/diagnosis-code.entity';
import { readBundledCatalogue } from '../seeds/icd-catalogue';
import { buildDataSourceOptions } from '../typeorm.options';

const BATCH_SIZE = 1000;
const logger = new Logger('SeedDiagnosisCodes');

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
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  logger.error((error as Error).message);
  process.exitCode = 1;
});
