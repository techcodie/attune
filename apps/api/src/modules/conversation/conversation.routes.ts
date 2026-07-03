import { Router } from 'express';
import { turnSchema } from '@cadence/types';
import { validateBody } from '../../lib/validate.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { conversationController } from './conversation.controller.js';

/**
 * Conversation endpoints, owner-scoped. Mounted alongside the interview router
 * under /interviews/:id so the live interview shares the same resource.
 */
export const conversationRouter: Router = Router();

conversationRouter.use(requireAuth);
conversationRouter.get('/:id/conversation', conversationController.snapshot);
conversationRouter.post('/:id/start', conversationController.start);
conversationRouter.post('/:id/turn', validateBody(turnSchema), conversationController.turn);
conversationRouter.post('/:id/end', conversationController.end);
conversationRouter.post('/:id/restart', conversationController.restart);
