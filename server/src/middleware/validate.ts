import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

// Checks req.body against a Zod schema and replaces it with the parsed (cleaned, typed) result.
// Invalid input throws a ZodError, which errorHandler turns into a 400 with per-field messages.
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
