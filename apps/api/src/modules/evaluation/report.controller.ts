import type { RequestHandler } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendSuccess } from '../../lib/http.js';
import { reportService } from './report.service.js';

export const reportController: Record<'get', RequestHandler> = {
  /** Returns the stored report, generating it once on first request. */
  get: asyncHandler(async (req, res) => {
    const report = await reportService.getOrGenerate(req.auth!.userId, req.params.id!);
    sendSuccess(res, report);
  }),
};
