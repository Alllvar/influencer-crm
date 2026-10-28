import type { RequestHandler } from 'express';
import { HttpError } from '../utils/HttpError';
import { verifyAccessToken } from '../modules/auth/tokens';
import type { Role } from '../modules/users/user.model';

// Lets a route through only with a valid "Authorization: Bearer <access token>" header,
// and puts the user's id and role on req.user for the handlers after it.
export const requireAuth: RequestHandler = (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Authentication required');

  const payload = verifyAccessToken(token);
  req.user = { id: payload.sub, role: payload.role };
  next();
};

// Use after requireAuth: requireRole('admin').
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) throw new HttpError(403, 'You do not have access to this action');
    next();
  };
