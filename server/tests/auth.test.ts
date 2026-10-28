import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, refreshCookie, registerUser } from './helpers';

describe('POST /api/auth/register', () => {
  it('creates a user, returns an access token and sets an httpOnly refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'Anna@Test.dev', name: 'Anna', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'anna@test.dev', name: 'Anna', role: 'admin' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(String(res.headers['set-cookie'])).toMatch(/refreshToken=.*HttpOnly/);
  });

  it('makes only the first user an admin', async () => {
    await registerUser();
    const second = await registerUser();
    expect(second.user.role).toBe('manager');
  });

  it('rejects a duplicate email with 409', async () => {
    await registerUser({ email: 'same@test.dev' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'SAME@test.dev', name: 'Again', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('validates the input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', name: 'A', password: '123' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['email', 'name', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password', async () => {
    const { user, password } = await registerUser();
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const { user } = await registerUser();
    const wrongPassword = await request(app).post('/api/auth/login').send({ email: user.email, password: 'nope-nope' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.dev', password: 'nope-nope' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const { user, token } = await registerUser();
    const res = await request(app).get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });

  it('rejects missing and forged tokens', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(auth('forged.token.value'))).status).toBe(401);
  });
});

describe('refresh token rotation', () => {
  it('exchanges a refresh cookie for new tokens', async () => {
    const { cookie } = await registerUser();
    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(refreshCookie(res)).not.toBe(cookie);
  });

  it('detects reuse of an old refresh token and revokes all sessions', async () => {
    const { cookie: first } = await registerUser();
    const rotated = await request(app).post('/api/auth/refresh').set('Cookie', first);
    const second = refreshCookie(rotated);

    const reuse = await request(app).post('/api/auth/refresh').set('Cookie', first);
    expect(reuse.status).toBe(401);

    // The legitimate newer token is revoked too, so a thief cannot keep a session alive.
    const afterReuse = await request(app).post('/api/auth/refresh').set('Cookie', second);
    expect(afterReuse.status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const { cookie } = await registerUser();
    expect((await request(app).post('/api/auth/logout').set('Cookie', cookie)).status).toBe(204);
    expect((await request(app).post('/api/auth/refresh').set('Cookie', cookie)).status).toBe(401);
  });
});

describe('/api/users (admin only)', () => {
  it('lets the admin list users and change roles, but not managers', async () => {
    const admin = await registerUser();
    const manager = await registerUser();

    expect((await request(app).get('/api/users').set(auth(manager.token))).status).toBe(403);

    const list = await request(app).get('/api/users').set(auth(admin.token));
    expect(list.status).toBe(200);
    expect(list.body.users).toHaveLength(2);

    const promote = await request(app)
      .patch(`/api/users/${manager.user.id}/role`)
      .set(auth(admin.token))
      .send({ role: 'admin' });
    expect(promote.status).toBe(200);
    expect(promote.body.user.role).toBe('admin');
  });

  it('does not let the admin demote themselves', async () => {
    const admin = await registerUser();
    const res = await request(app)
      .patch(`/api/users/${admin.user.id}/role`)
      .set(auth(admin.token))
      .send({ role: 'manager' });
    expect(res.status).toBe(400);
  });
});
