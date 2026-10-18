import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { RequestContext } from 'core/request-context/request-context';
import { ApiErrorBody, formatErrorResponse } from 'common/response-format';

interface ResolvedError {
  status: number;
  body: ApiErrorBody;
}

const PG_ERRORS: Record<string, { status: number; message: string }> = {
  '23505': {
    status: HttpStatus.CONFLICT,
    message: 'A record with these details already exists',
  },
  '23503': {
    status: HttpStatus.CONFLICT,
    message: 'This record is linked to other records',
  },
  '23502': {
    status: HttpStatus.BAD_REQUEST,
    message: 'A required field is missing',
  },
  '22P02': {
    status: HttpStatus.BAD_REQUEST,
    message: 'A value has an invalid format',
  },
};

const codeFor = (status: number): string => HttpStatus[status] ?? 'ERROR';

function fromHttpException(exception: HttpException): ResolvedError {
  const status = exception.getStatus();
  const response = exception.getResponse();
  const raw =
    typeof response === 'string'
      ? response
      : (response as { message?: unknown }).message;
  const messages = Array.isArray(raw)
    ? raw.map(String)
    : [typeof raw === 'string' ? raw : exception.message];
  return {
    status,
    body: {
      code: codeFor(status),
      message: messages.join(', '),
      ...(messages.length > 1 ? { details: messages } : {}),
    },
  };
}

function fromQueryFailed(driverError: unknown): ResolvedError {
  const pgCode = (driverError as { code?: string } | undefined)?.code ?? '';
  const known = PG_ERRORS[pgCode];
  const status = known?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
  return {
    status,
    body: {
      code: codeFor(status),
      message: known?.message ?? 'Internal server error',
    },
  };
}

export function resolveException(exception: unknown): ResolvedError {
  if (exception instanceof HttpException) return fromHttpException(exception);
  if (exception instanceof QueryFailedError)
    return fromQueryFailed(exception.driverError);
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: {
      code: codeFor(HttpStatus.INTERNAL_SERVER_ERROR),
      message: 'Internal server error',
    },
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = resolveException(exception);
    if (status >= 500) {
      // Log the class and message only; SQL parameters can carry patient data.
      const err = exception as Error;
      this.logger.error(
        `[${RequestContext.getCorrelationId() ?? '-'}] ${err?.name ?? 'Error'}: ${err?.message ?? String(exception)}`,
        err?.stack,
      );
    }

    const response = host.switchToHttp().getResponse<Response>();
    if (response.headersSent) return;
    response.status(status).json(formatErrorResponse(body));
  }
}
