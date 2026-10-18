import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { RequestContext } from './request-context';

export const CORRELATION_HEADER = 'x-request-id';
const SAFE_CORRELATION_ID = /^[A-Za-z0-9._-]{1,64}$/;

// Reuses a well-formed inbound request id so logs can be joined across services.
export function resolveCorrelationId(inbound: unknown): string {
  return typeof inbound === 'string' && SAFE_CORRELATION_ID.test(inbound)
    ? inbound
    : randomUUID();
}

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const correlationId = resolveCorrelationId(req.header(CORRELATION_HEADER));
  res.setHeader(CORRELATION_HEADER, correlationId);
  RequestContext.run({ correlationId }, next);
}
