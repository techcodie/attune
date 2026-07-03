import { PrismaClient } from '@prisma/client';
import { isDev } from '../env.js';

/**
 * A single shared PrismaClient. In dev we stash it on `globalThis` so tsx's
 * hot-reload doesn't spawn a new connection pool on every file change.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['warn', 'error'] : ['error'],
  });

if (isDev) globalForPrisma.prisma = prisma;

/** Best-effort connectivity probe used by the health endpoint. */
export async function checkDatabase(): Promise<'up' | 'down'> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'up';
  } catch {
    return 'down';
  }
}
