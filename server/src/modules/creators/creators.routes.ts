import { Router } from 'express';
import type { QueryFilter } from 'mongoose';
import { HttpError } from '../../utils/HttpError';
import { escapeRegex, paginate } from '../../utils/pagination';
import { parseSort } from '../../utils/sort';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { Campaign } from '../campaigns/campaign.model';
import { Creator, type CreatorDoc } from './creator.model';
import { createCreatorSchema, listCreatorsQuery, updateCreatorSchema } from './creator.schemas';

export const creatorsRouter = Router();

creatorsRouter.use(requireAuth);

// GET /api/creators?q=anna&platform=instagram&niche=beauty&minFollowers=10000&sort=-followers&page=1&limit=20
creatorsRouter.get('/', async (req, res) => {
  const query = listCreatorsQuery.parse(req.query);

  const filter: QueryFilter<CreatorDoc> = {};
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: rx }, { handle: rx }];
  }
  if (query.platform) filter.platform = query.platform;
  if (query.niche) filter.niches = query.niche;
  if (query.minFollowers !== undefined) filter.followers = { $gte: query.minFollowers };

  res.json(await paginate(Creator, filter, { page: query.page, limit: query.limit, sort: parseSort(query.sort) }));
});

creatorsRouter.post('/', validateBody(createCreatorSchema), async (req, res) => {
  const creator = await Creator.create({ ...req.body, createdBy: req.user!.id });
  res.status(201).json({ creator });
});

creatorsRouter.get('/:id', async (req, res) => {
  const creator = await Creator.findById(req.params.id);
  if (!creator) throw new HttpError(404, 'Creator not found');
  // Campaigns this creator takes part in, for the creator profile page.
  const campaigns = await Campaign.find({ 'creators.creator': creator._id })
    .select('name brand status startDate endDate creators.$')
    .sort({ startDate: -1 });
  res.json({ creator, campaigns });
});

creatorsRouter.patch('/:id', validateBody(updateCreatorSchema), async (req, res) => {
  const creator = await Creator.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!creator) throw new HttpError(404, 'Creator not found');
  res.json({ creator });
});

// Deleting is admin-only, and a creator who is part of a campaign cannot be deleted
// (it would silently break that campaign's pipeline).
creatorsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  if (await Campaign.exists({ 'creators.creator': req.params.id })) {
    throw new HttpError(409, 'This creator is part of a campaign. Remove them from campaigns first.');
  }
  const creator = await Creator.findByIdAndDelete(req.params.id);
  if (!creator) throw new HttpError(404, 'Creator not found');
  res.status(204).end();
});
