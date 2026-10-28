import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError, z } from 'zod';
import { HttpError } from '../utils/HttpError';
import { env } from '../config/env';

// The single place that turns any error into a JSON response with one consistent shape:
// { error: { message, details? } }. Express 5 forwards errors from async handlers here automatically.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: { message: 'Validation failed', details: z.flattenError(err).fieldErrors } });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: { message: `Invalid ${err.path}: ${String(err.value)}` } });
    return;
  }

  // Anything else is a bug: log it, and never leak internals to the client in production.
  console.error(err);
  res.status(500).json({
    error: { message: env.NODE_ENV === 'production' ? 'Internal server error' : String(err?.message ?? err) },
  });
};
