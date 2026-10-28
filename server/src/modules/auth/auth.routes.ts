import { Router, type CookieOptions, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env';
import { HttpError } from '../../utils/HttpError';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { User } from '../users/user.model';
import { loginSchema, registerSchema } from './auth.schemas';
import * as auth from './auth.service';

export const authRouter = Router();

const REFRESH_COOKIE = 'refreshToken';

// httpOnly: JavaScript in the browser cannot read the cookie, so an XSS bug cannot steal it.
// path: the browser sends it only to /api/auth, not with every API request.
// sameSite "strict": the client is served from the same origin as the API (Vite proxy in development,
// Express serving the built client in production), so the cookie is never needed cross-site. This also blocks CSRF.
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
};

function sendSession(res: Response, status: number, s: Awaited<ReturnType<typeof auth.login>>) {
  res.cookie(REFRESH_COOKIE, s.refreshToken, { ...cookieOptions, expires: s.refreshExpiresAt });
  res.status(status).json({ user: s.user, accessToken: s.accessToken });
}

// Slows down password guessing: at most 10 login/register attempts per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { error: { message: 'Too many attempts, please try again later' } },
});

authRouter.post('/register', authLimiter, validateBody(registerSchema), async (req, res) => {
  sendSession(res, 201, await auth.register(req.body));
});

authRouter.post('/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  sendSession(res, 200, await auth.login(req.body));
});

authRouter.post('/refresh', async (req, res) => {
  sendSession(res, 200, await auth.refresh(req.cookies?.[REFRESH_COOKIE]));
});

authRouter.post('/logout', async (req, res) => {
  await auth.logout(req.cookies?.[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user });
});
