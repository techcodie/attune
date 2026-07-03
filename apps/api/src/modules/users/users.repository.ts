import type { Prisma, User } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

/**
 * All User persistence. Pure data access — no hashing, no tokens, no HTTP.
 * Business rules live in the services that call these.
 */
export const usersRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: Pick<User, 'email' | 'passwordHash' | 'fullName'>): Promise<User> {
    return prisma.user.create({ data });
  },

  /** User plus a cheap boolean for whether they've completed their profile. */
  async findByIdWithProfileFlag(
    id: string,
  ): Promise<{ user: User; hasProfile: boolean } | null> {
    const row = await prisma.user.findUnique({
      where: { id },
      include: { profile: { select: { id: true } } },
    });
    if (!row) return null;
    const { profile, ...user } = row;
    return { user, hasProfile: profile !== null };
  },
};

export type UserCreateInput = Prisma.UserCreateInput;
