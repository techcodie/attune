import { Router } from 'express';
import { loginSchema, registerSchema } from '@cadence/types';
import { validateBody } from '../../lib/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { authController } from './auth.controller.js';

export const authRouter: Router = Router();

// Credential endpoints are rate-limited to blunt brute-force / token grinding.
authRouter.post('/register', authLimiter, validateBody(registerSchema), authController.register);
authRouter.post('/login', authLimiter, validateBody(loginSchema), authController.login);
authRouter.post('/refresh', authLimiter, authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, authController.me);
