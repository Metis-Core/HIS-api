import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { applyHttpHardening } from 'core/security/http-hardening';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applyHttpHardening(app);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.listen(process.env.PORT ?? 8000);
}

void bootstrap();
