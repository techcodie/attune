import type { Response } from 'express';
import type { ApiError, ApiSuccess } from '@cadence/types';

/**
 * A typed operational error. Anything thrown as an `AppError` is a *known*
 * failure with a stable code and a safe client message; anything else is
 * treated as an unexpected 500 by the error middleware.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: ApiError['error']['details'],
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: ApiError['error']['details']) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }
  static unauthorized(message = 'Authentication required') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'Not allowed') {
    return new AppError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Resource not found') {
    return new AppError(404, 'NOT_FOUND', message);
  }
  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }
  static tooManyRequests(message = 'Too many requests') {
    return new AppError(429, 'RATE_LIMITED', message);
  }
}

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const body: ApiSuccess<T> = { ok: true, data };
  res.status(status).json(body);
}

export function sendError(res: Response, err: AppError): void {
  const body: ApiError = {
    ok: false,
    error: { code: err.code, message: err.message, details: err.details },
  };
  res.status(err.statusCode).json(body);
}
