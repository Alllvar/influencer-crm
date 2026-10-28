// Mirrors the API's JSON shapes. Kept by hand next to the client because the two apps are small;
// in a bigger project these would be generated from the OpenAPI spec (/api/openapi.json).

export const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitch', 'x'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const CAMPAIGN_STATUSES = ['draft', 'active', 'completed', 'cancelled'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const PIPELINE_STAGES = [
  'invited',
  'negotiating',
  'contracted',
  'content_review',
  'published',
  'declined',
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type Role = 'admin' | 'manager';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  email?: string;
  country?: string;
  niches: string[];
  followers: number;
  engagementRate: number;
  avatarUrl?: string;
  notes: string;
  createdAt: string;
}

export type CreatorSummary = Pick<
  Creator,
  'id' | 'name' | 'handle' | 'platform' | 'followers' | 'engagementRate' | 'avatarUrl'
>;

export interface Deal<C = string> {
  creator: C;
  stage: PipelineStage;
  fee: number;
  deliverables: string;
  contentUrl?: string;
  updatedAt: string;
}

export interface Campaign<C = string> {
  id: string;
  name: string;
  brand: string;
  description: string;
  status: CampaignStatus;
  platforms: Platform[];
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  creators: Deal<C>[];
  createdAt: string;
}

export type CampaignWithCreators = Campaign<CreatorSummary | null>;

export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Overview {
  campaigns: { total: number; active: number; activeBudget: number; activeSpent: number };
  creators: { total: number; byPlatform: { platform: Platform; count: number; followers: number }[] };
  pipeline: { stage: PipelineStage; count: number; fees: number }[];
  upcoming: Campaign[];
}

export interface ApiError {
  status: number | string;
  data?: { error?: { message?: string; details?: Record<string, string[]> } };
}
