import type { CampaignStatus, PipelineStage, Platform } from '../api/types';

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const money = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatCompact = (n: number) => compact.format(n);
export const formatMoney = (n: number) => money.format(n);
export const formatDate = (iso: string) => date.format(new Date(iso));
export const formatRange = (from: string, to: string) => `${formatDate(from)} – ${formatDate(to)}`;

// For <input type="date">, which works with "YYYY-MM-DD".
export const toDateInput = (iso: string) => iso.slice(0, 10);

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitch: 'Twitch',
  x: 'X',
};

export const PLATFORM_COLOR: Record<Platform, string> = {
  instagram: '#d6249f',
  tiktok: '#0891b2',
  youtube: '#e11d1d',
  twitch: '#8b5cf6',
  x: '#475569',
};

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_COLOR: Record<CampaignStatus, 'default' | 'success' | 'info' | 'error'> = {
  draft: 'default',
  active: 'success',
  completed: 'info',
  cancelled: 'error',
};

export const STAGE_LABEL: Record<PipelineStage, string> = {
  invited: 'Invited',
  negotiating: 'Negotiating',
  contracted: 'Contracted',
  content_review: 'Content review',
  published: 'Published',
  declined: 'Declined',
};

export const STAGE_COLOR: Record<PipelineStage, string> = {
  invited: '#94a3b8',
  negotiating: '#f59e0b',
  contracted: '#3b82f6',
  content_review: '#8b5cf6',
  published: '#10b981',
  declined: '#ef4444',
};

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
