import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, auth, registerUser } from './helpers';

let admin: Awaited<ReturnType<typeof registerUser>>;
let manager: Awaited<ReturnType<typeof registerUser>>;
let creatorId: string;

const campaignBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'Summer Glow',
  brand: 'Lumi Cosmetics',
  budget: 20_000,
  startDate: '2026-06-01',
  endDate: '2026-08-31',
  platforms: ['instagram', 'tiktok'],
  ...overrides,
});

const createCampaign = async (overrides: Record<string, unknown> = {}) => {
  const res = await request(app).post('/api/campaigns').set(auth(manager.token)).send(campaignBody(overrides));
  expect(res.status).toBe(201);
  return res.body.campaign;
};

beforeEach(async () => {
  admin = await registerUser();
  manager = await registerUser();
  const res = await request(app)
    .post('/api/creators')
    .set(auth(manager.token))
    .send({ name: 'Anna', handle: 'anna', platform: 'instagram', followers: 120_000 });
  creatorId = res.body.creator.id;
});

describe('campaigns CRUD', () => {
  it('creates a draft campaign by default', async () => {
    const campaign = await createCampaign();
    expect(campaign).toMatchObject({ name: 'Summer Glow', status: 'draft', creators: [], spent: 0 });
  });

  it('rejects an end date before the start date, on create and on partial update', async () => {
    const res = await request(app)
      .post('/api/campaigns')
      .set(auth(manager.token))
      .send(campaignBody({ endDate: '2026-05-01' }));
    expect(res.status).toBe(400);

    const campaign = await createCampaign();
    const patch = await request(app)
      .patch(`/api/campaigns/${campaign.id}`)
      .set(auth(manager.token))
      .send({ endDate: '2026-01-01' });
    expect(patch.status).toBe(400);
  });

  it('filters the list by status', async () => {
    await createCampaign({ name: 'A', status: 'active' });
    await createCampaign({ name: 'B', status: 'draft' });
    const res = await request(app).get('/api/campaigns?status=active').set(auth(manager.token));
    expect(res.body.items.map((c: { name: string }) => c.name)).toEqual(['A']);
  });

  it('lets only admins delete campaigns', async () => {
    const campaign = await createCampaign();
    expect((await request(app).delete(`/api/campaigns/${campaign.id}`).set(auth(manager.token))).status).toBe(403);
    expect((await request(app).delete(`/api/campaigns/${campaign.id}`).set(auth(admin.token))).status).toBe(204);
  });
});

describe('creator pipeline inside a campaign', () => {
  it('adds a creator, moves them through stages and counts the spend', async () => {
    const campaign = await createCampaign({ status: 'active' });

    const added = await request(app)
      .post(`/api/campaigns/${campaign.id}/creators`)
      .set(auth(manager.token))
      .send({ creatorId, fee: 1500, deliverables: '2 reels + 3 stories' });
    expect(added.status).toBe(201);
    expect(added.body.campaign.creators[0]).toMatchObject({ stage: 'invited', fee: 1500, creator: { handle: 'anna' } });
    expect(added.body.campaign.spent).toBe(0);

    const moved = await request(app)
      .patch(`/api/campaigns/${campaign.id}/creators/${creatorId}`)
      .set(auth(manager.token))
      .send({ stage: 'contracted' });
    expect(moved.body.campaign.creators[0].stage).toBe('contracted');
    expect(moved.body.campaign.spent).toBe(1500);
  });

  it('does not add the same creator twice', async () => {
    const campaign = await createCampaign();
    const add = () =>
      request(app).post(`/api/campaigns/${campaign.id}/creators`).set(auth(manager.token)).send({ creatorId });
    expect((await add()).status).toBe(201);
    expect((await add()).status).toBe(409);
  });

  it('protects creators that are in a campaign from deletion, until they are removed', async () => {
    const campaign = await createCampaign();
    await request(app).post(`/api/campaigns/${campaign.id}/creators`).set(auth(manager.token)).send({ creatorId });

    expect((await request(app).delete(`/api/creators/${creatorId}`).set(auth(admin.token))).status).toBe(409);

    const removed = await request(app)
      .delete(`/api/campaigns/${campaign.id}/creators/${creatorId}`)
      .set(auth(manager.token));
    expect(removed.body.campaign.creators).toHaveLength(0);
    expect((await request(app).delete(`/api/creators/${creatorId}`).set(auth(admin.token))).status).toBe(204);
  });
});

describe('GET /api/stats/overview', () => {
  it('aggregates campaigns, creators and the pipeline', async () => {
    const campaign = await createCampaign({ status: 'active', budget: 10_000 });
    await request(app)
      .post(`/api/campaigns/${campaign.id}/creators`)
      .set(auth(manager.token))
      .send({ creatorId, fee: 2000 });
    await request(app)
      .patch(`/api/campaigns/${campaign.id}/creators/${creatorId}`)
      .set(auth(manager.token))
      .send({ stage: 'published' });

    const res = await request(app).get('/api/stats/overview').set(auth(manager.token));
    expect(res.status).toBe(200);
    expect(res.body.campaigns).toMatchObject({ total: 1, active: 1, activeBudget: 10_000, activeSpent: 2000 });
    expect(res.body.creators.total).toBe(1);
    expect(res.body.pipeline.find((p: { stage: string }) => p.stage === 'published')).toMatchObject({
      count: 1,
      fees: 2000,
    });
    expect(res.body.pipeline).toHaveLength(6);
  });
});
