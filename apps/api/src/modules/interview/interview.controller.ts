import type { RequestHandler } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendSuccess } from '../../lib/http.js';
import { interviewService } from './interview.service.js';

export const interviewController: Record<
  'create' | 'list' | 'detail' | 'coverage' | 'dashboard',
  RequestHandler
> = {
  create: asyncHandler(async (req, res) => {
    const detail = await interviewService.create(req.auth!.userId, req.body);
    sendSuccess(res, detail, 201);
  }),

  list: asyncHandler(async (req, res) => {
    const interviews = await interviewService.list(req.auth!.userId);
    sendSuccess(res, interviews);
  }),

  detail: asyncHandler(async (req, res) => {
    const detail = await interviewService.getDetail(req.auth!.userId, req.params.id!);
    sendSuccess(res, detail);
  }),

  coverage: asyncHandler(async (req, res) => {
    const coverage = await interviewService.getCoverage(req.auth!.userId, req.params.id!);
    sendSuccess(res, coverage);
  }),

  dashboard: asyncHandler(async (req, res) => {
    const stats = await interviewService.getDashboard(req.auth!.userId);
    sendSuccess(res, stats);
  }),
};
