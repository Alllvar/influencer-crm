import type { RequestHandler } from 'express';
import { HttpError } from '../utils/HttpError';

// Runs only when no route matched the request.
export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
