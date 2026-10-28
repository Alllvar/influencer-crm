import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';
import { PLATFORMS } from '../creators/creator.model';
import { CAMPAIGN_STATUSES, PIPELINE_STAGES } from './campaign.model';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const campaignFields = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(120),
  description: z.string().max(5000),
  status: z.enum(CAMPAIGN_STATUSES),
  platforms: z.array(z.enum(PLATFORMS)).max(PLATFORMS.length),
  budget: z.number().min(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const datesInOrder = (d: { startDate?: Date; endDate?: Date }) => !d.startDate || !d.endDate || d.endDate >= d.startDate;
const datesMessage = { message: 'End date must be on or after the start date', path: ['endDate'] };

export const createCampaignSchema = campaignFields
  .extend({
    description: campaignFields.shape.description.default(''),
    status: campaignFields.shape.status.default('draft'),
    platforms: campaignFields.shape.platforms.default([]),
  })
  .refine(datesInOrder, datesMessage);

export const updateCampaignSchema = campaignFields.partial().refine(datesInOrder, datesMessage);

export const addCreatorSchema = z.object({
  creatorId: objectId,
  fee: z.number().min(0).default(0),
  deliverables: z.string().max(500).default(''),
});

export const updateDealSchema = z
  .object({
    stage: z.enum(PIPELINE_STAGES),
    fee: z.number().min(0),
    deliverables: z.string().max(500),
    contentUrl: z.url().or(z.literal('')),
  })
  .partial();

export const listCampaignsQuery = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  sort: z.enum(['-startDate', 'startDate', '-budget', 'name', '-createdAt']).default('-startDate'),
});
