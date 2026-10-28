import { Router } from 'express';
import mongoose from 'mongoose';

export const healthRouter = Router();

// Used by the hosting platform (and by us) to check that the API is alive and sees the database.
healthRouter.get('/', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    db: dbConnected ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
  });
});
