/**
 * Augments Express' Request with the authenticated identity that `requireAuth`
 * attaches, so downstream handlers get `req.auth` with full typing.
 */
import 'express';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
      };
    }
  }
}

export {};
