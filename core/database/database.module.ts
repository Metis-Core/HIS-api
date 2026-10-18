import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from 'core/config/configuration';
import { validateEnv } from 'core/config/env.validation';
import { buildDataSourceOptions } from 'core/database/typeorm.options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [configuration],
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...buildDataSourceOptions({
          NODE_ENV: configService.get<string>('NODE_ENV'),
          DB_HOST: configService.getOrThrow<string>('database.host'),
          DB_PORT: String(configService.get<number>('database.port') ?? 5432),
          DB_USERNAME: configService.getOrThrow<string>('database.username'),
          DB_PASSWORD: configService.getOrThrow<string>('database.password'),
          DB_NAME: configService.getOrThrow<string>('database.name'),
          DB_SYNCHRONIZE: configService.get<string>('DB_SYNCHRONIZE'),
          DB_RUN_MIGRATIONS: configService.get<string>('DB_RUN_MIGRATIONS'),
        }),
        autoLoadEntities: true,
        entities: [],
      }),
    }),
  ],
})
export class DatabaseModule {}
