import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.options';

/**
 * CLI DataSource for TypeORM migrations.
 *
 * Important: `migration:generate` compares registered `entities` to the *live*
 * database schema only. It ignores unapplied migration files. Always run
 * `npm run migration:run` (or use `npm run migration:generate`, which does
 * that for you) before generating, or TypeORM will emit CREATE TABLE for
 * everything that exists in entities but not yet in the DB.
 */
export default new DataSource(buildDataSourceOptions());
