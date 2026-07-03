import { createApp } from './app.js';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { ensureDemoAccount } from './lib/demo.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`cadence-api listening on http://localhost:${env.PORT}`, {
    env: env.NODE_ENV,
  });
  // Seed the one-click demo account if missing. Non-blocking — a failure here
  // must never take down the server.
  void ensureDemoAccount().catch((err) =>
    logger.error('Failed to ensure demo account', { message: String(err) }),
  );
});

/** Graceful shutdown so Railway/containers can recycle us cleanly. */
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down…`);
  server.close(async () => {
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  });
  // Hard-exit if connections don't drain in time.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
