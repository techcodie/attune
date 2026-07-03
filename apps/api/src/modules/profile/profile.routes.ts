import { Router } from 'express';
import { profileSchema } from '@cadence/types';
import { validateBody } from '../../lib/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { profileController } from './profile.controller.js';

export const profileRouter: Router = Router();

// Everything here is behind auth — a profile always belongs to the caller.
profileRouter.use(requireAuth);
profileRouter.get('/', profileController.get);
profileRouter.put('/', validateBody(profileSchema), profileController.upsert);
