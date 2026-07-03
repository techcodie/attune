import type { NextFunction, Request, Response, RequestHandler } from 'express';

/**
 * Express 4 doesn't forward rejected promises to the error middleware.
 * Wrapping async handlers keeps every route free of repetitive try/catch.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
