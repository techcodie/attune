import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';

/**
 * Body-validation middleware. On success it *replaces* `req.body` with the
 * parsed (and coerced/sanitised) value so handlers work with trusted data.
 * On failure it forwards the ZodError, which the error handler renders as a
 * 400 with field-level details.
 */
export function validateBody<S extends ZodTypeAny>(schema: S) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    req.body = parsed.data as z.infer<S>;
    next();
  };
}
