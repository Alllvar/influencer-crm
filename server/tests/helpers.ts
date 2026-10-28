import request from 'supertest';
import { createApp } from '../src/app';

export const app = createApp();

let counter = 0;

// Registers a fresh user and returns its access token and refresh cookie.
// The first user registered in a test becomes the admin.
export async function registerUser(overrides: Partial<{ email: string; name: string; password: string }> = {}) {
  counter += 1;
  const body = { email: `user${counter}@test.dev`, name: `User ${counter}`, password: 'password123', ...overrides };
  const res = await request(app).post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return {
    user: res.body.user,
    token: res.body.accessToken as string,
    cookie: refreshCookie(res),
    password: body.password,
  };
}

export function refreshCookie(res: request.Response): string {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const cookie = cookies.find((c) => c.startsWith('refreshToken='));
  if (!cookie) throw new Error('no refresh cookie in response');
  return cookie.split(';')[0];
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
