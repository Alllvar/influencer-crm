import { Router } from 'express';
import type { QueryFilter } from 'mongoose';
import { HttpError } from '../../utils/HttpError';
import { escapeRegex, paginate } from '../../utils/pagination';
import { parseSort } from '../../utils/sort';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { Creator } from '../creators/creator.model';
import { Campaign, type CampaignDoc } from './campaign.model';
import {
  addCreatorSchema,
  createCampaignSchema,
  listCampaignsQuery,
  updateCampaignSchema,
  updateDealSchema,
} from './campaign.schemas';

export const campaignsRouter = Router();

campaignsRouter.use(requireAuth);

// The campaign page shows each deal with the creator's profile, so creator ids are replaced with documents.
const withCreators = (id: string) =>
  Campaign.findById(id).populate('creators.creator', 'name handle platform followers engagementRate avatarUrl');

async function getPopulated(id: string) {
  const campaign = await withCreators(id);
  if (!campaign) throw new HttpError(404, 'Campaign not found');
  return campaign;
}

campaignsRouter.get('/', async (req, res) => {
  const query = listCampaignsQuery.parse(req.query);

  const filter: QueryFilter<CampaignDoc> = {};
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: rx }, { brand: rx }];
  }
  if (query.status) filter.status = query.status;

  res.json(await paginate(Campaign, filter, { page: query.page, limit: query.limit, sort: parseSort(query.sort) }));
});

campaignsRouter.post('/', validateBody(createCampaignSchema), async (req, res) => {
  const campaign = await Campaign.create({ ...req.body, createdBy: req.user!.id });
  res.status(201).json({ campaign });
});

campaignsRouter.get('/:id', async (req, res) => {
  res.json({ campaign: await getPopulated(req.params.id) });
});

campaignsRouter.patch('/:id', validateBody(updateCampaignSchema), async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw new HttpError(404, 'Campaign not found');
  campaign.set(req.body);
  // Checked against the saved values too: a PATCH may change only one of the two dates.
  if (campaign.endDate < campaign.startDate) throw new HttpError(400, 'End date must be on or after the start date');
  await campaign.save();
  res.json({ campaign: await getPopulated(campaign.id) });
});

campaignsRouter.delete('/:id', requireRole('admin'), async (req, res) => {
  const campaign = await Campaign.findByIdAndDelete(req.params.id);
  if (!campaign) throw new HttpError(404, 'Campaign not found');
  res.status(204).end();
});

// ---------- Creator deals inside a campaign ----------

campaignsRouter.post('/:id/creators', validateBody(addCreatorSchema), async (req, res) => {
  const { creatorId, fee, deliverables } = req.body;
  if (!(await Creator.exists({ _id: creatorId }))) throw new HttpError(404, 'Creator not found');

  // Atomic "add if not already there": the filter matches only when the creator is not in the campaign yet,
  // so two simultaneous requests cannot add the same creator twice.
  const updated = await Campaign.findOneAndUpdate(
    { _id: req.params.id, 'creators.creator': { $ne: creatorId } },
    { $push: { creators: { creator: creatorId, fee, deliverables, stage: 'invited', updatedAt: new Date() } } },
  );
  if (!updated) {
    if (!(await Campaign.exists({ _id: req.params.id }))) throw new HttpError(404, 'Campaign not found');
    throw new HttpError(409, 'This creator is already in the campaign');
  }
  res.status(201).json({ campaign: await getPopulated(updated.id) });
});

campaignsRouter.patch('/:id/creators/:creatorId', validateBody(updateDealSchema), async (req, res) => {
  // "creators.$" is the array element matched by the filter, so only that one deal changes.
  const set: Record<string, unknown> = { 'creators.$.updatedAt': new Date() };
  for (const [key, value] of Object.entries(req.body)) set[`creators.$.${key}`] = value;

  const updated = await Campaign.findOneAndUpdate(
    { _id: req.params.id, 'creators.creator': req.params.creatorId },
    { $set: set },
    { runValidators: true },
  );
  if (!updated) throw new HttpError(404, 'Campaign or creator in this campaign not found');
  res.json({ campaign: await getPopulated(updated.id) });
});

campaignsRouter.delete('/:id/creators/:creatorId', async (req, res) => {
  const updated = await Campaign.findOneAndUpdate(
    { _id: req.params.id, 'creators.creator': req.params.creatorId },
    { $pull: { creators: { creator: req.params.creatorId } } },
  );
  if (!updated) throw new HttpError(404, 'Campaign or creator in this campaign not found');
  res.json({ campaign: await getPopulated(req.params.id) });
});
