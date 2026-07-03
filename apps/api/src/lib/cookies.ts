import type { CookieOptions, Response } from 'express';
import { env, isProd } from '../env.js';

/**
 * The refresh token lives in an httpOnly cookie so JavaScript (and thus XSS)
 * can never read it. It is path-scoped to the auth routes, so it's only ever
 * transmitted where it's actually needed.
 */
export const REFRESH_COOKIE = 'cadence_rt';
const REFRESH_PATH = '/api/v1/auth';

function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    // Cross-site in prod (vercel ↔ railway) needs SameSite=None; Secure.
    // Same-site localhost in dev works with Lax and no HTTPS.
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: REFRESH_PATH,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions(), expires: expiresAt });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, baseOptions());
}
