import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from 'core/config/configuration';
import { buildDataSourceOptions } from 'core/database/typeorm.options';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...buildDataSourceOptions({
          DB_HOST: configService.get<string>('database.host'),
          DB_PORT: String(configService.get<number>('database.port') ?? 5432),
          DB_USERNAME: configService.get<string>('database.username'),
          DB_PASSWORD: configService.get<string>('database.password'),
          DB_NAME: configService.get<string>('database.name')
        }),
        autoLoadEntities: true,
        entities: [],
      }),
    }),
  ],
})
export class DatabaseModule {}
