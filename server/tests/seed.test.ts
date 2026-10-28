import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { DEMO_ADMIN, seedDemoData } from '../src/db/seed';
import { app, auth } from './helpers';

describe('demo data', () => {
  it('seeds an empty database once, and the demo admin can log in and see data', async () => {
    expect(await seedDemoData()).toBe(true);
    expect(await seedDemoData()).toBe(false);

    const login = await request(app).post('/api/auth/login').send(DEMO_ADMIN);
    expect(login.status).toBe(200);
    expect(login.body.user.role).toBe('admin');

    const stats = await request(app).get('/api/stats/overview').set(auth(login.body.accessToken));
    expect(stats.body.creators.total).toBe(20);
    expect(stats.body.campaigns.total).toBe(8);
  });
});

describe('API docs', () => {
  it('serves the OpenAPI spec generated from the Zod schemas', async () => {
    const res = await request(app).get('/api/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.paths['/api/creators'].post.requestBody.content['application/json'].schema.required).toEqual(
      expect.arrayContaining(['name', 'handle', 'platform', 'followers']),
    );
  });
});
