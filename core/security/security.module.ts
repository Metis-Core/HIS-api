import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthThrottlerGuard } from './auth-throttler.guard';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        errorMessage: 'Too many attempts. Please wait a minute and try again.',
        throttlers: [
          {
            name: 'auth',
            ttl: Number(config.get('THROTTLE_AUTH_TTL_SECONDS') ?? 60) * 1000,
            limit: Number(config.get('THROTTLE_AUTH_LIMIT') ?? 5),
          },
        ],
      }),
    }),
  ],
  providers: [AuthThrottlerGuard],
  exports: [ThrottlerModule, AuthThrottlerGuard],
})
export class SecurityModule {}
