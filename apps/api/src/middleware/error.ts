import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../lib/http.js';
import { logger } from '../lib/logger.js';
import { isProd } from '../env.js';

/** Terminal error handler — every thrown/next(err) funnels through here. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Zod validation errors → 400 with field-level details.
  if (err instanceof ZodError) {
    const appErr = AppError.badRequest(
      'Validation failed',
      err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
    sendError(res, appErr);
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error(err.message, { code: err.code });
    sendError(res, err);
    return;
  }

  // Unknown → 500. Never leak internals to the client.
  const message = err instanceof Error ? err.message : String(err);
  logger.error('Unhandled error', { message, stack: err instanceof Error ? err.stack : undefined });
  sendError(
    res,
    new AppError(500, 'INTERNAL_ERROR', isProd ? 'Something went wrong' : message),
  );
}
