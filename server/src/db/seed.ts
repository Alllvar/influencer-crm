import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User } from '../modules/users/user.model';
import { Creator, type Platform } from '../modules/creators/creator.model';
import { Campaign, type PipelineStage } from '../modules/campaigns/campaign.model';

export const DEMO_ADMIN = { email: 'demo@influencer-crm.dev', password: 'demo12345', name: 'Demo Admin' };
export const DEMO_MANAGER = { email: 'manager@influencer-crm.dev', password: 'demo12345', name: 'Mia Manager' };

type CreatorSeed = [
  name: string,
  handle: string,
  platform: Platform,
  followers: number,
  er: number,
  niches: string[],
  country: string,
];

// Fictional creators: any resemblance to real accounts is accidental.
const CREATORS: CreatorSeed[] = [
  ['Sofia Lane', 'sofialane', 'instagram', 412_000, 3.8, ['beauty', 'skincare'], 'Spain'],
  ['Marco Velli', 'marcoeats', 'tiktok', 1_250_000, 7.1, ['food'], 'Italy'],
  ['Hanna Kowal', 'hanna.moves', 'instagram', 86_000, 5.6, ['fitness', 'wellness'], 'Poland'],
  ['Leo Brandt', 'leobuilds', 'youtube', 640_000, 4.2, ['tech', 'diy'], 'Germany'],
  ['Ava Chen', 'avaplays', 'twitch', 230_000, 9.4, ['gaming'], 'Canada'],
  ['Nora Field', 'norafield', 'instagram', 54_000, 6.3, ['travel', 'photography'], 'Norway'],
  ['Daniel Osei', 'danfinance', 'youtube', 310_000, 3.1, ['finance', 'education'], 'UK'],
  ['Ira Melnyk', 'ira.style', 'tiktok', 780_000, 8.2, ['fashion', 'beauty'], 'Ukraine'],
  ['Tom Rivers', 'tomoutdoors', 'youtube', 155_000, 4.9, ['travel', 'outdoors'], 'USA'],
  ['Lina Haddad', 'linacooks', 'instagram', 198_000, 5.1, ['food', 'family'], 'France'],
  ['Kai Moreno', 'kaitech', 'x', 92_000, 2.4, ['tech', 'ai'], 'USA'],
  ['Emma Stone-Hill', 'emmareads', 'tiktok', 365_000, 6.8, ['books', 'education'], 'Ireland'],
  ['Oleh Bondar', 'olehfit', 'instagram', 128_000, 4.4, ['fitness'], 'Ukraine'],
  ['Mila Novak', 'milamakeup', 'youtube', 905_000, 3.6, ['beauty'], 'Czechia'],
  ['Ravi Patel', 'ravigames', 'twitch', 512_000, 7.7, ['gaming', 'tech'], 'India'],
  ['Clara Weiss', 'claraliving', 'instagram', 73_000, 5.9, ['interior', 'lifestyle'], 'Austria'],
  ['Jonas Berg', 'jonasruns', 'tiktok', 241_000, 6.1, ['fitness', 'outdoors'], 'Sweden'],
  ['Zoe Martin', 'zoeparents', 'instagram', 167_000, 4.7, ['family', 'lifestyle'], 'Belgium'],
  ['Pablo Ruiz', 'pablodesign', 'x', 48_000, 3.3, ['design', 'tech'], 'Mexico'],
  ['Yuki Tanaka', 'yukicrafts', 'youtube', 276_000, 5.4, ['diy', 'art'], 'Japan'],
];

const day = 24 * 60 * 60 * 1000;
const fromToday = (days: number) => new Date(Date.now() + days * day);

type DealSeed = [creatorIndex: number, stage: PipelineStage, fee: number, deliverables: string];
interface CampaignSeed {
  name: string;
  brand: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  platforms: Platform[];
  budget: number;
  start: number;
  end: number;
  deals: DealSeed[];
}

const CAMPAIGNS: CampaignSeed[] = [
  {
    name: 'Summer Glow Launch',
    brand: 'Lumi Cosmetics',
    description: 'Launch of the SPF serum line. Focus on honest routines and before/after content.',
    status: 'active',
    platforms: ['instagram', 'tiktok', 'youtube'],
    budget: 24_000,
    start: -20,
    end: 40,
    deals: [
      [0, 'published', 3200, '1 reel + 4 stories'],
      [7, 'content_review', 4500, '2 TikToks'],
      [13, 'contracted', 6000, '1 dedicated YouTube review'],
      [2, 'negotiating', 1200, '1 reel'],
      [17, 'invited', 0, '1 reel + 2 stories'],
    ],
  },
  {
    name: 'Play Week 2026',
    brand: 'Nimbus Peripherals',
    description: 'Streams with the new wireless headset, discount code per creator.',
    status: 'active',
    platforms: ['twitch', 'youtube'],
    budget: 18_000,
    start: -5,
    end: 25,
    deals: [
      [4, 'contracted', 5000, '3 sponsored streams'],
      [14, 'content_review', 5500, '3 streams + 1 highlight video'],
      [3, 'negotiating', 3500, '1 integration'],
      [10, 'declined', 0, 'Thread + 2 posts'],
    ],
  },
  {
    name: 'Taste of Autumn',
    brand: 'Harvest Table',
    description: 'Seasonal recipes with the meal-kit box. Recipe cards linked to a landing page.',
    status: 'active',
    platforms: ['instagram', 'tiktok'],
    budget: 12_000,
    start: -10,
    end: 30,
    deals: [
      [1, 'published', 5200, '2 TikToks'],
      [9, 'contracted', 2400, '1 reel + recipe post'],
      [17, 'invited', 0, '1 reel'],
    ],
  },
  {
    name: 'Move Every Day',
    brand: 'Pulse Wear',
    description: '30-day challenge with the fitness tracker band.',
    status: 'draft',
    platforms: ['instagram', 'tiktok'],
    budget: 15_000,
    start: 14,
    end: 60,
    deals: [
      [12, 'negotiating', 1800, '4 stories per week'],
      [16, 'invited', 0, '3 TikToks'],
      [2, 'invited', 0, '2 reels'],
    ],
  },
  {
    name: 'Smart Money Basics',
    brand: 'Coinly',
    description: 'Educational series about budgeting with the Coinly app.',
    status: 'completed',
    platforms: ['youtube', 'x'],
    budget: 9_000,
    start: -90,
    end: -30,
    deals: [
      [6, 'published', 4000, '1 dedicated video'],
      [10, 'published', 1500, '1 thread'],
    ],
  },
  {
    name: 'Cozy Home Edit',
    brand: 'Nordhaus',
    description: 'Home décor collection, styled room tours.',
    status: 'completed',
    platforms: ['instagram', 'youtube'],
    budget: 11_000,
    start: -120,
    end: -60,
    deals: [
      [15, 'published', 2600, '1 reel + carousel'],
      [19, 'published', 3800, '1 YouTube DIY video'],
    ],
  },
  {
    name: 'Back to Books',
    brand: 'Pageturner',
    description: 'Reading challenge with the e-reader subscription.',
    status: 'draft',
    platforms: ['tiktok'],
    budget: 6_000,
    start: 30,
    end: 75,
    deals: [[11, 'invited', 0, '3 TikToks']],
  },
  {
    name: 'Trail Season',
    brand: 'Ridgeline Gear',
    description: 'Hiking backpack launch. Cancelled after the product recall.',
    status: 'cancelled',
    platforms: ['youtube', 'instagram'],
    budget: 14_000,
    start: -40,
    end: -5,
    deals: [
      [8, 'declined', 0, '1 vlog'],
      [5, 'declined', 0, '1 reel'],
    ],
  },
];

// Fills an empty database with demo data. Does nothing if any user exists,
// so it is safe to call on every start.
export async function seedDemoData({ reset = false } = {}): Promise<boolean> {
  if (reset) {
    await Promise.all([User.deleteMany({}), Creator.deleteMany({}), Campaign.deleteMany({})]);
  } else if (await User.exists({})) {
    return false;
  }

  const hash = await bcrypt.hash(DEMO_ADMIN.password, 10);
  const [admin, manager] = await User.create([
    { email: DEMO_ADMIN.email, name: DEMO_ADMIN.name, passwordHash: hash, role: 'admin' },
    { email: DEMO_MANAGER.email, name: DEMO_MANAGER.name, passwordHash: hash, role: 'manager' },
  ]);

  const creators = await Creator.insertMany(
    CREATORS.map(([name, handle, platform, followers, engagementRate, niches, country], i) => ({
      name,
      handle,
      platform,
      followers,
      engagementRate,
      niches,
      country,
      email: `${handle.replace(/\./g, '')}@example.com`,
      notes: i % 3 === 0 ? 'Fast replies, prefers long-term deals.' : '',
      createdBy: i % 2 ? manager._id : admin._id,
    })),
  );

  await Campaign.insertMany(
    CAMPAIGNS.map((c, i) => ({
      name: c.name,
      brand: c.brand,
      description: c.description,
      status: c.status,
      platforms: c.platforms,
      budget: c.budget,
      startDate: fromToday(c.start),
      endDate: fromToday(c.end),
      createdBy: i % 2 ? manager._id : admin._id,
      creators: c.deals.map(([idx, stage, fee, deliverables], j) => ({
        creator: creators[idx]._id as Types.ObjectId,
        stage,
        fee,
        deliverables,
        updatedAt: fromToday(-j),
      })),
    })),
  );

  return true;
}
