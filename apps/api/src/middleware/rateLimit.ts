import rateLimit from 'express-rate-limit';
import { AppError } from '../lib/http.js';
import { isProd } from '../env.js';

/**
 * Rate limiting. An in-memory store is fine for a single instance / MVP; the
 * README notes swapping in a Redis store for horizontal scale. Limits are
 * relaxed in dev so they never get in the way of local testing.
 *
 * The handler funnels through our AppError so limited requests get the same
 * consistent `{ ok:false, error }` envelope as everything else.
 */
const limitHandler = (): never => {
  throw AppError.tooManyRequests('Too many attempts. Please try again shortly.');
};

/** Tight limiter for credential endpoints (login/register/refresh). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 10 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitHandler,
});

/** Broad safety net for the rest of the API. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isProd ? 100 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limitHandler,
});
