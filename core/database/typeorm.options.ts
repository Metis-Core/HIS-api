import { config as loadEnv } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';

loadEnv();

export type DatabaseEnv = {
  DB_HOST?: string;
  DB_PORT?: string;
  DB_USERNAME?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
};

export function buildDataSourceOptions(
  env: DatabaseEnv = process.env,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: parseInt(env.DB_PORT ?? '5432', 10),
    username: env.DB_USERNAME ?? 'postgres',
    password: env.DB_PASSWORD ?? 'postgres',
    database: env.DB_NAME ?? 'his',
    synchronize: false,
    migrationsRun: true,
    logging: process.env.NODE_ENV !== 'production',
    entities,
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    migrationsTableName: 'typeorm_migrations',
  };
}
