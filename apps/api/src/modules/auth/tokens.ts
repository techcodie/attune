import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../env.js';

/**
 * Token primitives. Two very different kinds of token:
 *
 *  • Access token — a short-lived signed JWT the client sends as a Bearer
 *    header. Stateless: we trust the signature, never hit the DB.
 *  • Refresh token — a long-lived *opaque* random string. We hand the client
 *    the raw value (in an httpOnly cookie) but persist only its SHA-256 hash,
 *    so a database leak can't be replayed. Rotated on every use.
 */

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  // `expiresIn` is typed as a template-literal StringValue in @types/jsonwebtoken,
  // so we cast our env string to the option's own type.
  const options: jwt.SignOptions = {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    issuer: 'cadence',
    // Unique per token so no two access tokens are ever byte-identical (JWT
    // iat/exp are second-granular) and a revocation list stays possible later.
    jwtid: randomUUID(),
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/** Returns the payload if valid, or null on any verification failure. */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'cadence' });
    if (typeof decoded === 'string') return null;
    return { sub: String(decoded.sub), email: String(decoded.email) };
  } catch {
    return null;
  }
}

/** A fresh opaque refresh token plus the hash we store and its expiry. */
export interface GeneratedRefreshToken {
  raw: string;
  hash: string;
  expiresAt: Date;
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateRefreshToken(now: Date): GeneratedRefreshToken {
  const raw = randomBytes(48).toString('base64url');
  const expiresAt = new Date(now.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { raw, hash: hashRefreshToken(raw), expiresAt };
}
