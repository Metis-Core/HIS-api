import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthThrottlerGuard } from 'core/security/auth-throttler.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'auth', ttl: 60_000, limit: 5 }]),
      ],
      controllers: [AuthController],
      providers: [
        AuthThrottlerGuard,
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            me: jest.fn(),
            changePassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('rate-limits login, but not token refresh', () => {
    // Arrange
    const guardsOf = (method: string): unknown[] =>
      (Reflect.getMetadata(
        '__guards__',
        Object.getOwnPropertyDescriptor(AuthController.prototype, method)
          ?.value as object,
      ) as unknown[]) ?? [];
    // Act
    const loginGuards = guardsOf('login');
    const refreshGuards = guardsOf('refresh');
    // Assert
    expect(loginGuards).toContain(AuthThrottlerGuard);
    expect(refreshGuards).not.toContain(AuthThrottlerGuard);
  });
});
