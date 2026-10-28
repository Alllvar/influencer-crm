import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { Campaign, PIPELINE_STAGES } from '../campaigns/campaign.model';
import { Creator, PLATFORMS } from '../creators/creator.model';

export const statsRouter = Router();

statsRouter.use(requireAuth);

// Dashboard numbers, computed inside MongoDB with aggregation pipelines
// instead of loading every document into Node.
statsRouter.get('/overview', async (_req, res) => {
  const [campaignTotals, pipeline, creatorsByPlatform, creatorsTotal, upcoming] = await Promise.all([
    // Number of campaigns and total budget per status.
    Campaign.aggregate<{ _id: string; count: number; budget: number }>([
      { $group: { _id: '$status', count: { $sum: 1 }, budget: { $sum: '$budget' } } },
    ]),

    // How many creator deals sit in each pipeline stage across active campaigns, and their total fees.
    Campaign.aggregate<{ _id: string; count: number; fees: number }>([
      { $match: { status: 'active' } },
      { $unwind: '$creators' },
      { $group: { _id: '$creators.stage', count: { $sum: 1 }, fees: { $sum: '$creators.fee' } } },
    ]),

    Creator.aggregate<{ _id: string; count: number; followers: number }>([
      { $group: { _id: '$platform', count: { $sum: 1 }, followers: { $sum: '$followers' } } },
    ]),

    Creator.countDocuments(),

    Campaign.find({ status: { $in: ['draft', 'active'] }, endDate: { $gte: new Date() } })
      .sort({ startDate: 1 })
      .limit(5)
      .select('name brand status budget startDate endDate creators'),
  ]);

  const byStatus = Object.fromEntries(campaignTotals.map((s) => [s._id, { count: s.count, budget: s.budget }]));
  const activeFees = pipeline
    .filter((p) => ['contracted', 'content_review', 'published'].includes(p._id))
    .reduce((sum, p) => sum + p.fees, 0);

  res.json({
    campaigns: {
      total: campaignTotals.reduce((sum, s) => sum + s.count, 0),
      active: byStatus.active?.count ?? 0,
      activeBudget: byStatus.active?.budget ?? 0,
      activeSpent: activeFees,
    },
    creators: {
      total: creatorsTotal,
      byPlatform: PLATFORMS.map((p) => {
        const row = creatorsByPlatform.find((r) => r._id === p);
        return { platform: p, count: row?.count ?? 0, followers: row?.followers ?? 0 };
      }),
    },
    // Every stage is listed, even empty ones, so the chart always has the same columns.
    pipeline: PIPELINE_STAGES.map((stage) => {
      const row = pipeline.find((p) => p._id === stage);
      return { stage, count: row?.count ?? 0, fees: row?.fees ?? 0 };
    }),
    upcoming,
  });
});
