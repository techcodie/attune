import { Router } from 'express';
import { createInterviewSchema } from '@cadence/types';
import { validateBody } from '../../lib/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { interviewController } from './interview.controller.js';

export const interviewRouter: Router = Router();

// Everything here is owner-scoped.
interviewRouter.use(requireAuth);

// Dashboard aggregate lives here so it shares the interview module's service.
interviewRouter.get('/dashboard', interviewController.dashboard);

interviewRouter.post('/', validateBody(createInterviewSchema), interviewController.create);
interviewRouter.get('/', interviewController.list);
interviewRouter.get('/:id', interviewController.detail);
interviewRouter.get('/:id/coverage', interviewController.coverage);
