import { Router } from 'express';
import type { HealthStatus } from '@cadence/types';
import { asyncHandler } from '../lib/asyncHandler.js';
import { sendSuccess } from '../lib/http.js';
import { checkDatabase } from '../lib/prisma.js';

const START = Date.now();

export const healthRouter: Router = Router();

/**
 * GET /health — liveness + dependency probe.
 * The frontend hits this on the landing page to prove the stack is wired.
 */
healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const database = await checkDatabase();
    const payload: HealthStatus = {
      status: database === 'down' ? 'degraded' : 'ok',
      service: 'cadence-api',
      version: process.env.npm_package_version ?? '0.1.0',
      uptimeSec: Math.round((Date.now() - START) / 1000),
      database,
      timestamp: new Date().toISOString(),
    };
    sendSuccess(res, payload);
  }),
);
