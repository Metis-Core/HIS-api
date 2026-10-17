import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type ThrottledRequest = {
  ip?: string;
  body?: {
    identifier?: unknown;
    userId?: unknown;
    verificationToken?: unknown;
  };
};

// Key on IP plus the targeted account so one busy reception PC cannot lock out everyone else.
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: ThrottledRequest): Promise<string> {
    const body = req.body ?? {};
    const subject = [body.identifier, body.userId, body.verificationToken].find(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
    return Promise.resolve(
      `${req.ip ?? 'unknown'}:${subject?.toLowerCase() ?? ''}`,
    );
  }
}
