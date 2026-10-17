import { config as loadEnv } from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';

loadEnv();

export type DatabaseEnv = {
  NODE_ENV?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_USERNAME?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
  DB_SYNCHRONIZE?: string;
  DB_RUN_MIGRATIONS?: string;
};

const REQUIRED_KEYS = [
  'DB_HOST',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
] as const;

function assertDatabaseEnv(env: DatabaseEnv): void {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing database environment variables: ${missing.join(', ')}`,
    );
  }
  if (env.NODE_ENV === 'production' && env.DB_SYNCHRONIZE === 'true') {
    throw new Error(
      'DB_SYNCHRONIZE must not be enabled in production; use migrations',
    );
  }
}

export function buildDataSourceOptions(
  env: DatabaseEnv = process.env,
): DataSourceOptions {
  assertDatabaseEnv(env);
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT ?? '5432', 10),
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: env.DB_SYNCHRONIZE === 'true',
    migrationsRun: env.DB_RUN_MIGRATIONS === 'true',
    logging:
      env.NODE_ENV !== 'production'
        ? ['error', 'warn', 'migration']
        : ['error'],
    entities,
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    migrationsTableName: 'typeorm_migrations',
  };
}
