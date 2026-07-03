import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/http.js';

/** Any unmatched route becomes a clean 404 handled by the error middleware. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
}
