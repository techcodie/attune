import type { Request, RequestHandler, Response } from 'express';
import type { AuthUser } from '@cadence/types';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { AppError, sendSuccess } from '../../lib/http.js';
import {
  REFRESH_COOKIE,
  clearRefreshCookie,
  setRefreshCookie,
} from '../../lib/cookies.js';
import { usersRepository } from '../users/users.repository.js';
import { authService, type SessionContext } from './auth.service.js';
import type { IssuedSession } from './auth.service.js';

/** Pull auditing context (device + IP) off the request. */
function sessionContext(req: Request): SessionContext {
  return {
    deviceInfo: req.headers['user-agent']?.slice(0, 255),
    ipAddress: req.ip,
  };
}

/** Set the rotating refresh cookie and return the client-facing auth payload. */
function completeSession(res: Response, session: IssuedSession, status: number): void {
  setRefreshCookie(res, session.refresh.raw, session.refresh.expiresAt);
  sendSuccess(res, session.result, status);
}

export const authController: Record<
  'register' | 'login' | 'refresh' | 'logout' | 'me',
  RequestHandler
> = {
  register: asyncHandler(async (req, res) => {
    const session = await authService.register(req.body, sessionContext(req));
    completeSession(res, session, 201);
  }),

  login: asyncHandler(async (req, res) => {
    const session = await authService.login(req.body, sessionContext(req));
    completeSession(res, session, 200);
  }),

  refresh: asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) throw AppError.unauthorized('No active session');
    const session = await authService.rotate(raw, sessionContext(req));
    completeSession(res, session, 200);
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    clearRefreshCookie(res);
    sendSuccess(res, { success: true });
  }),

  /** Current identity for the authenticated caller. */
  me: asyncHandler(async (req, res) => {
    const found = await usersRepository.findByIdWithProfileFlag(req.auth!.userId);
    if (!found) throw AppError.unauthorized('Account no longer exists');
    const user: AuthUser = {
      id: found.user.id,
      email: found.user.email,
      fullName: found.user.fullName,
      hasProfile: found.hasProfile,
    };
    sendSuccess(res, user);
  }),
};
