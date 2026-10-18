import { AuthThrottlerGuard } from './auth-throttler.guard';

class ExposedGuard extends AuthThrottlerGuard {
  track(req: Parameters<AuthThrottlerGuard['getTracker']>[0]): Promise<string> {
    return this.getTracker(req);
  }
}

describe('AuthThrottlerGuard', () => {
  const guard = Object.create(ExposedGuard.prototype) as ExposedGuard;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keys login attempts on IP and lower-cased identifier', async () => {
    // Arrange
    const req = { ip: '10.0.0.7', body: { identifier: 'Nurse.Amina' } };
    // Act
    const key = await guard.track(req);
    // Assert
    expect(key).toBe('10.0.0.7:nurse.amina');
  });

  it('falls back to the IP when the body has no subject', async () => {
    // Arrange
    const req = { ip: '10.0.0.7', body: {} };
    // Act
    const key = await guard.track(req);
    // Assert
    expect(key).toBe('10.0.0.7:');
  });
});
