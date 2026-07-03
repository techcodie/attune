import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { reportController } from './report.controller.js';

export const reportRouter: Router = Router();

reportRouter.use(requireAuth);
reportRouter.get('/:id/report', reportController.get);
