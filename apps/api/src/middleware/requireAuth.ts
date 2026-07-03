import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/http.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';

/**
 * Gate for protected routes. Reads the Bearer access token, verifies its
 * signature/expiry, and attaches `req.auth`. Rejects with 401 otherwise.
 * Stateless by design — no DB round-trip on the hot path.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(AppError.unauthorized('Missing access token'));
    return;
  }

  const payload = verifyAccessToken(header.slice('Bearer '.length).trim());
  if (!payload) {
    next(AppError.unauthorized('Invalid or expired access token'));
    return;
  }

  req.auth = { userId: payload.sub, email: payload.email };
  next();
}
