import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProcedureTest } from 'src/orders/entities/procedure-test.entity';
import {
  IMAGING_AND_PROCEDURE_CATALOGUE,
  SeedProcedureTest,
} from '../seeds/procedure-catalogue';
import { buildDataSourceOptions } from '../typeorm.options';

const logger = new Logger('SeedProcedureCatalogue');
const inactive = process.argv.includes('--inactive');

const toRow = (seed: SeedProcedureTest) => ({
  code: seed.code,
  abbreviation: seed.abbreviation ?? null,
  name: seed.name,
  description: seed.description ?? null,
  kind: seed.kind,
  category: seed.category,
  price: seed.price,
  durationMinutes: seed.durationMinutes ?? null,
  preparation: seed.preparation ?? null,
  resultSchema: { fields: seed.fields },
  isActive: !inactive,
});

async function seed(): Promise<void> {
  const dataSource = await new DataSource(
    buildDataSourceOptions(),
  ).initialize();
  const tests = dataSource.getRepository(ProcedureTest);
  const counts = { created: 0, completed: 0, unchanged: 0 };
  try {
    for (const entry of IMAGING_AND_PROCEDURE_CATALOGUE) {
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
      if (existing.resultSchema?.fields?.length) {
        counts.unchanged += 1;
        continue;
      }
      await tests.update(existing.id, {
        resultSchema: { fields: entry.fields },
      });
      counts.completed += 1;
    }
    logger.log(
      `Imaging and procedures: ${counts.created} added, ${counts.completed} given a template, ${counts.unchanged} left as they were`,
    );
  } finally {
    await dataSource.destroy();
  }
}

void seed();
