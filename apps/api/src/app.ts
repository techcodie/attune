import express, { type Express, type RequestHandler } from 'express';
import cors from 'cors';
import * as helmetModule from 'helmet';
import cookieParser from 'cookie-parser';
import { env, isProd } from './env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/error.js';
import { notFound } from './middleware/notFound.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { healthRouter } from './routes/health.js';
import { versionRouter } from './routes/version.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { profileRouter } from './modules/profile/profile.routes.js';
import { interviewRouter } from './modules/interview/interview.routes.js';
import { conversationRouter } from './modules/conversation/conversation.routes.js';
import { reportRouter } from './modules/evaluation/report.routes.js';

// helmet 8 exposes its middleware factory only as the `default` export and ships
// no `types` condition in its package exports, so some compilers (notably
// Vercel's) mis-type it as a non-callable namespace and fail the build. At
// runtime `.default` IS the factory, so we cast to its known callable type —
// this compiles under any moduleResolution / esModuleInterop setting.
const helmet = helmetModule.default as unknown as () => RequestHandler;

/**
 * Builds the Express app. Kept separate from the server bootstrap so it can be
 * imported directly by integration tests without binding a port.
 */
export function createApp(): Express {
  const app = express();

  // Behind Railway/Vercel we sit behind a proxy; trust it so `req.ip` and
  // secure-cookie detection reflect the real client.
  if (isProd) app.set('trust proxy', 1);

  // Security + parsing
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestLogger);

  // Unversioned health + version for platform probes and the reviewer.
  app.use('/health', healthRouter);
  app.use('/version', versionRouter);

  // Versioned API. A broad limiter guards everything; auth routes add a
  // tighter one of their own.
  const api = express.Router();
  api.use(apiLimiter);
  api.use('/health', healthRouter);
  api.use('/version', versionRouter);
  api.use('/auth', authRouter);
  api.use('/profile', profileRouter);
  api.use('/interviews', interviewRouter);
  api.use('/interviews', conversationRouter);
  api.use('/interviews', reportRouter);
  app.use('/api/v1', api);

  // Fallbacks
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
