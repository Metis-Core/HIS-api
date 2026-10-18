import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LabTest } from 'src/lab/entities/lab-test.entity';
import { LAB_CATALOGUE, SeedLabTest } from '../seeds/lab-catalogue';
import { buildDataSourceOptions } from '../typeorm.options';

const logger = new Logger('SeedLabCatalogue');
// New tests stay inactive (not orderable) until an admin has checked the placeholder price, unless --activate.
const activate = process.argv.includes('--activate');

const toRow = (seed: SeedLabTest) => ({
  code: seed.code,
  abbreviation: seed.abbreviation ?? null,
  name: seed.name,
  description: seed.description ?? null,
  category: seed.category,
  sampleType: seed.sampleType,
  unit: seed.unit ?? null,
  price: seed.price,
  turnaroundHours: seed.turnaroundHours ?? null,
  resultSchema: { fields: seed.fields },
  isActive: activate,
});

// Idempotent: a test already on file (same code or name) keeps their price, status and any template an admin already built.
async function seed(): Promise<void> {
  const dataSource = await new DataSource(
    buildDataSourceOptions(),
  ).initialize();
  const tests = dataSource.getRepository(LabTest);
  const counts = { created: 0, completed: 0, unchanged: 0 };
  try {
    for (const entry of LAB_CATALOGUE) {
      const existing = await tests
        .createQueryBuilder('test')
        .withDeleted()
        .where('test.code = :code OR LOWER(test.name) = LOWER(:name)', {
          code: entry.code,
          name: entry.name,
        })
        .getOne();
      if (!existing) {
        await tests.save(tests.create(toRow(entry)));
        counts.created += 1;
        continue;
      }
      const patch = {
        ...(existing.abbreviation || !entry.abbreviation
          ? {}
          : { abbreviation: entry.abbreviation }),
        ...(existing.resultSchema?.fields?.length
          ? {}
          : { resultSchema: { fields: entry.fields } }),
      };
      if (Object.keys(patch).length === 0) {
        counts.unchanged += 1;
        continue;
      }
      await tests.update(existing.id, patch);
      counts.completed += 1;
    }
    logger.log(
      `Lab catalogue: ${counts.created} created (${activate ? 'active' : 'inactive until priced'}), ${counts.completed} existing tests given a template/abbreviation, ${counts.unchanged} unchanged`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  logger.error((error as Error).message);
  process.exitCode = 1;
});
