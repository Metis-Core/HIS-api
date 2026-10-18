import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Service } from 'src/services/entities/service.entity';
import { SERVICE_CATALOGUE } from '../seeds/service-catalogue';
import { buildDataSourceOptions } from '../typeorm.options';

const logger = new Logger('SeedServiceCatalogue');

// Idempotent: a service already on file (same code or name) keeps its fee and status; a missing code is filled in.
async function seed(): Promise<void> {
  const dataSource = await new DataSource(
    buildDataSourceOptions(),
  ).initialize();
  const services = dataSource.getRepository(Service);
  const counts = { created: 0, coded: 0, unchanged: 0 };
  try {
    for (const entry of SERVICE_CATALOGUE) {
      const existing = await services
        .createQueryBuilder('service')
        .withDeleted()
        .where('LOWER(service.name) = LOWER(:name)', { name: entry.name })
        .orWhere('service.code = :code', { code: entry.code ?? '' })
        .getOne();
      if (!existing) {
        await services.save(
          services.create({
            code: entry.code ?? null,
            name: entry.name,
            fee: entry.fee,
            description: entry.description ?? null,
            isActive: true,
          }),
        );
        counts.created += 1;
        continue;
      }
      if (entry.code && !existing.code) {
        await services.update(existing.id, { code: entry.code });
        counts.coded += 1;
        continue;
      }
      counts.unchanged += 1;
    }
    logger.log(
      `Services: ${counts.created} added, ${counts.coded} existing given a system code, ${counts.unchanged} left as they were`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  logger.error((error as Error).message);
  process.exitCode = 1;
});
