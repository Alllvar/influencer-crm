import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { HttpError } from '../../utils/HttpError';
import { User, type Role } from '../users/user.model';
import { Session } from './session.model';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { createRefreshToken, signAccessToken, verifyRefreshToken } from './tokens';

// Cost factor: each +1 doubles the hashing time. Low in tests only, to keep them fast.
const BCRYPT_ROUNDS = env.NODE_ENV === 'test' ? 4 : 12;

// Compared against when the email does not exist, so a wrong email and a wrong password
// take the same time and an attacker cannot find out which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

async function issueTokens(user: { id: string; role: Role }) {
  const accessToken = signAccessToken(user.id, user.role);
  const refresh = await createRefreshToken(user.id);
  return { accessToken, refreshToken: refresh.token, refreshExpiresAt: refresh.expiresAt };
}

export async function register(input: RegisterInput) {
  if (await User.exists({ email: input.email.toLowerCase() })) {
    throw new HttpError(409, 'Email is already registered');
  }
  // The very first account becomes the admin; everyone after that starts as a manager.
  const role: Role = (await User.countDocuments()) === 0 ? 'admin' : 'manager';
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({ email: input.email, name: input.name, passwordHash, role });
  return { user, ...(await issueTokens({ id: user.id, role })) };
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
  const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'Invalid email or password');
  return { user, ...(await issueTokens({ id: user.id, role: user.role })) };
}

// Refresh token rotation: every refresh token works exactly once and is replaced by a new one.
// If an already used token shows up again, it was probably stolen, so every session of that user is revoked.
export async function refresh(token: string | undefined) {
  if (!token) throw new HttpError(401, 'No refresh token');
  const payload = verifyRefreshToken(token);

  const session = await Session.findOneAndDelete({ jti: payload.jti });
  if (!session) {
    await Session.deleteMany({ user: payload.sub });
    throw new HttpError(401, 'Refresh token was already used or revoked');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'User no longer exists');
  return { user, ...(await issueTokens({ id: user.id, role: user.role })) };
}

export async function logout(token: string | undefined) {
  if (!token) return;
  try {
    const { jti } = verifyRefreshToken(token);
    await Session.deleteOne({ jti });
  } catch {
    // An invalid token has nothing to revoke; logout still succeeds.
  }
}
