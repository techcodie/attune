import type { RequestHandler } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { sendSuccess } from '../../lib/http.js';
import { profileService } from './profile.service.js';

export const profileController: Record<'get' | 'upsert', RequestHandler> = {
  /** Returns the caller's profile, or `null` if they haven't completed it. */
  get: asyncHandler(async (req, res) => {
    const profile = await profileService.get(req.auth!.userId);
    sendSuccess(res, profile);
  }),

  /** Create or update the caller's profile. */
  upsert: asyncHandler(async (req, res) => {
    const profile = await profileService.save(req.auth!.userId, req.body);
    sendSuccess(res, profile);
  }),
};
