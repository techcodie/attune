import type { RequestHandler } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendSuccess } from '../../lib/http.js';
import { conversationService } from './conversation.service.js';

export const conversationController: Record<
  'snapshot' | 'start' | 'turn' | 'end' | 'restart',
  RequestHandler
> = {
  snapshot: asyncHandler(async (req, res) => {
    const snapshot = await conversationService.getSnapshot(req.auth!.userId, req.params.id!);
    sendSuccess(res, snapshot);
  }),

  start: asyncHandler(async (req, res) => {
    const result = await conversationService.start(req.auth!.userId, req.params.id!);
    sendSuccess(res, result);
  }),

  turn: asyncHandler(async (req, res) => {
    const result = await conversationService.turn(
      req.auth!.userId,
      req.params.id!,
      req.body.candidateText,
    );
    sendSuccess(res, result);
  }),

  end: asyncHandler(async (req, res) => {
    const snapshot = await conversationService.endEarly(req.auth!.userId, req.params.id!);
    sendSuccess(res, snapshot);
  }),

  restart: asyncHandler(async (req, res) => {
    const snapshot = await conversationService.restart(req.auth!.userId, req.params.id!);
    sendSuccess(res, snapshot);
  }),
};
