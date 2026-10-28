import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { openApiSpec } from './docs/openapi';
import { healthRouter } from './routes/health';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { creatorsRouter } from './modules/creators/creators.routes';
import { campaignsRouter } from './modules/campaigns/campaigns.routes';
import { statsRouter } from './modules/stats/stats.routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

// The built React app (client/dist). In production Express serves it, so the client and the API
// share one origin: no CORS in the browser and the refresh cookie can stay sameSite=strict.
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

// Builds the Express app without starting it, so tests can use it directly through supertest.
export function createApp() {
  const app = express();

  // Render, Railway and similar hosts sit behind a proxy: trust it so rate limiting sees the real client IP.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (env.NODE_ENV === 'development') app.use(morgan('dev'));

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/creators', creatorsRouter);
  app.use('/api/campaigns', campaignsRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'Influencer CRM API' }));
  app.get('/api/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  if (fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1y', immutable: true }));
    // Client-side routes (/campaigns/123 etc.) all get index.html; React Router takes it from there.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(CLIENT_DIST, 'index.html'), { maxAge: 0 });
    });
  }

  // Order matters: notFound after all routes, errorHandler last.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
