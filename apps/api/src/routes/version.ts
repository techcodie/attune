import { Router } from 'express';
import { sendSuccess } from '../lib/http.js';
import { env } from '../env.js';

const START = Date.now();

export const versionRouter: Router = Router();

/**
 * GET /version — build/runtime metadata for ops and the reviewer. Intentionally
 * exposes nothing sensitive (no secrets, no DB URL).
 */
versionRouter.get('/', (_req, res) => {
  sendSuccess(res, {
    service: 'cadence-api',
    version: process.env.npm_package_version ?? '0.1.0',
    commit: process.env.GIT_COMMIT ?? 'dev',
    environment: env.NODE_ENV,
    llmProvider: env.LLM_PROVIDER,
    node: process.version,
    uptimeSec: Math.round((Date.now() - START) / 1000),
  });
});
