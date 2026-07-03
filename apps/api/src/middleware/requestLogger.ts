import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

/** Logs each request's method, path, status and duration once it completes. */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      durationMs: Math.round(durationMs),
    });
  });
  next();
}
