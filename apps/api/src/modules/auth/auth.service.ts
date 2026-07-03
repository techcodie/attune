import type { User } from '@prisma/client';
import type { AuthResult, AuthUser, LoginInput, RegisterInput } from '@cadence/types';
import { AppError } from '../../lib/http.js';
import { logger } from '../../lib/logger.js';
import { usersRepository } from '../users/users.repository.js';
import { refreshTokenRepository } from './refreshToken.repository.js';
import { hashPassword, verifyPassword } from './password.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from './tokens.js';

/** Where the request came from — stored on the refresh token for auditing. */
export interface SessionContext {
  deviceInfo?: string | undefined;
  ipAddress?: string | undefined;
}

/** What a service call hands back: the client payload + the raw cookie value. */
export interface IssuedSession {
  result: AuthResult;
  refresh: { raw: string; expiresAt: Date };
}

function toAuthUser(user: User, hasProfile: boolean): AuthUser {
  return { id: user.id, email: user.email, fullName: user.fullName, hasProfile };
}

/**
 * Mint a brand-new session: a fresh refresh token (persisted as a hash) and a
 * signed access token. Shared by register, login and rotation.
 */
async function issueSession(
  user: User,
  hasProfile: boolean,
  ctx: SessionContext,
): Promise<IssuedSession> {
  const now = new Date();
  const refresh = generateRefreshToken(now);

  await refreshTokenRepository.create({
    tokenHash: refresh.hash,
    userId: user.id,
    expiresAt: refresh.expiresAt,
    deviceInfo: ctx.deviceInfo,
    ipAddress: ctx.ipAddress,
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  return {
    result: { user: toAuthUser(user, hasProfile), accessToken },
    refresh: { raw: refresh.raw, expiresAt: refresh.expiresAt },
  };
}

export const authService = {
  async register(input: RegisterInput, ctx: SessionContext): Promise<IssuedSession> {
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) {
      throw AppError.conflict('An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await usersRepository.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
    });

    logger.info('User registered', { userId: user.id });
    return issueSession(user, false, ctx);
  },

  async login(input: LoginInput, ctx: SessionContext): Promise<IssuedSession> {
    const user = await usersRepository.findByEmail(input.email);
    // Same error whether the email is unknown or the password is wrong — never
    // leak which accounts exist.
    const invalid = AppError.unauthorized('Invalid email or password');
    if (!user) throw invalid;

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw invalid;

    const withFlag = await usersRepository.findByIdWithProfileFlag(user.id);
    return issueSession(user, withFlag?.hasProfile ?? false, ctx);
  },

  /**
   * Rotate a refresh token: validate the presented token, revoke it, and issue
   * a new pair. If a *revoked* token is presented (replay), we treat it as a
   * breach and revoke every session for that user.
   */
  async rotate(rawToken: string, ctx: SessionContext): Promise<IssuedSession> {
    const now = new Date();
    const tokenHash = hashRefreshToken(rawToken);
    const stored = await refreshTokenRepository.findByHash(tokenHash);

    const invalid = AppError.unauthorized('Session expired, please sign in again');
    if (!stored) throw invalid;

    if (stored.revokedAt) {
      logger.warn('Refresh token replay detected — revoking all sessions', {
        userId: stored.userId,
      });
      await refreshTokenRepository.revokeAllForUser(stored.userId, now);
      throw invalid;
    }

    if (stored.expiresAt.getTime() <= now.getTime()) throw invalid;

    const withFlag = await usersRepository.findByIdWithProfileFlag(stored.userId);
    if (!withFlag) throw invalid;

    // Issue the successor first, then point the old token at it and revoke it.
    const issued = await issueSession(withFlag.user, withFlag.hasProfile, ctx);
    await refreshTokenRepository.revoke(
      stored.id,
      hashRefreshToken(issued.refresh.raw),
      now,
    );
    return issued;
  },

  /** Revoke the presented refresh token, if it exists. Idempotent. */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const stored = await refreshTokenRepository.findByHash(hashRefreshToken(rawToken));
    if (stored && !stored.revokedAt) {
      await refreshTokenRepository.revoke(stored.id, null, new Date());
    }
  },
};
