import type { RefreshToken } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export interface CreateRefreshTokenInput {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  deviceInfo?: string | undefined;
  ipAddress?: string | undefined;
}

/**
 * Persistence for refresh tokens. Every token is stored only as a hash; this
 * layer never sees or returns a raw token.
 */
export const refreshTokenRepository = {
  create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        tokenHash: input.tokenHash,
        userId: input.userId,
        expiresAt: input.expiresAt,
        deviceInfo: input.deviceInfo ?? null,
        ipAddress: input.ipAddress ?? null,
      },
    });
  },

  findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  /** Revoke one token and record the successor it was rotated into. */
  async revoke(id: string, replacedByTokenHash: string | null, now: Date): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: now, replacedByTokenHash },
    });
  },

  /** Breach response: kill every active session for a user. */
  async revokeAllForUser(userId: string, now: Date): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
  },
};
