import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';
import helmet from 'helmet';

export function applyHttpHardening(app: INestApplication): void {
  const config = app.get(ConfigService);
  const origins = config.get<string[]>('corsOrigins') ?? [];
  const trustProxy = config.get<string>('TRUST_PROXY');

  if (trustProxy) {
    (app.getHttpAdapter().getInstance() as Express).set(
      'trust proxy',
      Number(trustProxy) || trustProxy,
    );
  }
  app.use(helmet());
  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
  });
}
