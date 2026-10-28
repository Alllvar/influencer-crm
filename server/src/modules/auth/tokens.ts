import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { HttpError } from '../../utils/HttpError';
import type { Role } from '../users/user.model';
import { Session } from './session.model';

export interface AccessPayload {
  sub: string;
  role: Role;
}

interface RefreshPayload {
  sub: string;
  jti: string;
}

// Short-lived token sent with every API request in the Authorization header.
// Not stored anywhere on the server: it is valid until it expires.
export function signAccessToken(userId: string, role: Role): string {
  return jwt.sign({ role } satisfies Omit<AccessPayload, 'sub'>, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
  } catch {
    throw new HttpError(401, 'Invalid or expired access token');
  }
}

// Long-lived token kept in an httpOnly cookie, used only to get a new access token.
// Each one is tied to a Session document, so it can be revoked (logout) and used only once (rotation).
export async function createRefreshToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await Session.create({ user: userId, jti, expiresAt });
  const token = jwt.sign({ jti }, env.JWT_REFRESH_SECRET, {
    subject: userId,
    expiresIn: env.REFRESH_TTL_DAYS * 24 * 60 * 60,
  });
  return { token, expiresAt };
}

export function verifyRefreshToken(token: string): RefreshPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }
}
