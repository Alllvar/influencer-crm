import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';
import { PLATFORMS } from './creator.model';

export const createCreatorSchema = z.object({
  name: z.string().trim().min(1).max(100),
  // Stored without a leading "@" so "@anna" and "anna" are the same handle.
  handle: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .transform((h) => h.replace(/^@/, '')),
  platform: z.enum(PLATFORMS),
  email: z.email().optional().or(z.literal('').transform(() => undefined)),
  country: z.string().trim().max(60).optional(),
  niches: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10).default([]),
  followers: z.number().int().min(0),
  engagementRate: z.number().min(0).max(100).default(0),
  avatarUrl: z.url().optional().or(z.literal('').transform(() => undefined)),
  notes: z.string().max(2000).default(''),
});

// PATCH: every field optional, but no defaults, so missing fields stay untouched.
export const updateCreatorSchema = createCreatorSchema
  .extend({
    niches: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10),
    engagementRate: z.number().min(0).max(100),
    notes: z.string().max(2000),
  })
  .partial();

export const listCreatorsQuery = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  platform: z.enum(PLATFORMS).optional(),
  niche: z.string().trim().toLowerCase().optional(),
  minFollowers: z.coerce.number().int().min(0).optional(),
  sort: z.enum(['followers', '-followers', 'engagementRate', '-engagementRate', 'name', '-createdAt']).default('-followers'),
});
