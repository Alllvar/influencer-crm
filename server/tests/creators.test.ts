import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, registerUser } from './helpers';

let admin: Awaited<ReturnType<typeof registerUser>>;
let manager: Awaited<ReturnType<typeof registerUser>>;

const creator = (overrides: Record<string, unknown> = {}) => ({
  name: 'Anna Style',
  handle: '@anna.style',
  platform: 'instagram',
  followers: 120_000,
  engagementRate: 4.2,
  niches: ['Beauty', 'fashion'],
  ...overrides,
});

const createCreator = async (overrides: Record<string, unknown> = {}) => {
  const res = await request(app).post('/api/creators').set(auth(manager.token)).send(creator(overrides));
  expect(res.status).toBe(201);
  return res.body.creator;
};

beforeEach(async () => {
  admin = await registerUser();
  manager = await registerUser();
});

describe('creators CRUD', () => {
  it('creates a creator and normalises the input', async () => {
    const created = await createCreator();
    expect(created).toMatchObject({ handle: 'anna.style', niches: ['beauty', 'fashion'], followers: 120_000 });
    expect(created.id).toEqual(expect.any(String));
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/creators')).status).toBe(401);
  });

  it('rejects the same handle on the same platform', async () => {
    await createCreator();
    const res = await request(app)
      .post('/api/creators')
      .set(auth(manager.token))
      .send(creator({ handle: 'anna.style' }));
    expect(res.status).toBe(409);
  });

  it('updates only the fields that were sent', async () => {
    const created = await createCreator();
    const res = await request(app)
      .patch(`/api/creators/${created.id}`)
      .set(auth(manager.token))
      .send({ followers: 150_000 });
    expect(res.status).toBe(200);
    expect(res.body.creator).toMatchObject({ followers: 150_000, name: 'Anna Style', engagementRate: 4.2 });
  });

  it('returns 400 for a malformed id and 404 for a missing one', async () => {
    expect((await request(app).get('/api/creators/not-an-id').set(auth(manager.token))).status).toBe(400);
    expect((await request(app).get('/api/creators/507f1f77bcf86cd799439011').set(auth(manager.token))).status).toBe(
      404,
    );
  });

  it('lets only admins delete', async () => {
    const created = await createCreator();
    expect((await request(app).delete(`/api/creators/${created.id}`).set(auth(manager.token))).status).toBe(403);
    expect((await request(app).delete(`/api/creators/${created.id}`).set(auth(admin.token))).status).toBe(204);
  });
});

describe('GET /api/creators (search, filters, pagination)', () => {
  beforeEach(async () => {
    await createCreator({
      name: 'Anna Style',
      handle: 'anna',
      platform: 'instagram',
      followers: 120_000,
      niches: ['beauty'],
    });
    await createCreator({
      name: 'Max Games',
      handle: 'maxgames',
      platform: 'twitch',
      followers: 800_000,
      niches: ['gaming'],
    });
    await createCreator({
      name: 'Olena Cooks',
      handle: 'olena',
      platform: 'youtube',
      followers: 45_000,
      niches: ['food'],
    });
  });

  const list = (query: string) => request(app).get(`/api/creators?${query}`).set(auth(manager.token));

  it('sorts by followers, biggest first, by default', async () => {
    const res = await list('');
    expect(res.body.items.map((c: { handle: string }) => c.handle)).toEqual(['maxgames', 'anna', 'olena']);
    expect(res.body).toMatchObject({ total: 3, page: 1, totalPages: 1 });
  });

  it('searches by name or handle, case-insensitively, treating input literally', async () => {
    expect((await list('q=OLENA')).body.items).toHaveLength(1);
    expect((await list('q=.*')).body.items).toHaveLength(0);
  });

  it('filters by platform, niche and minimum followers', async () => {
    expect((await list('platform=twitch')).body.items[0].handle).toBe('maxgames');
    expect((await list('niche=beauty')).body.items[0].handle).toBe('anna');
    expect((await list('minFollowers=100000')).body.total).toBe(2);
  });

  it('paginates', async () => {
    const res = await list('limit=2&page=2');
    expect(res.body).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
    expect(res.body.items).toHaveLength(1);
  });

  it('rejects invalid query params', async () => {
    expect((await list('platform=myspace')).status).toBe(400);
    expect((await list('limit=1000')).status).toBe(400);
  });
});
