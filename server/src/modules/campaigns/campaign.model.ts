import { Schema, model, Types, type InferSchemaType } from 'mongoose';
import { PLATFORMS } from '../creators/creator.model';

export const CAMPAIGN_STATUSES = ['draft', 'active', 'completed', 'cancelled'] as const;

// The deal pipeline for each creator inside a campaign (the columns of the board in the UI).
export const PIPELINE_STAGES = ['invited', 'negotiating', 'contracted', 'content_review', 'published', 'declined'] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

const campaignCreatorSchema = new Schema(
  {
    creator: { type: Types.ObjectId, ref: 'Creator', required: true },
    stage: { type: String, enum: PIPELINE_STAGES, default: 'invited' },
    fee: { type: Number, min: 0, default: 0 },
    deliverables: { type: String, default: '' },
    contentUrl: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const campaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: 'draft' },
    platforms: { type: [{ type: String, enum: PLATFORMS }], default: [] },
    budget: { type: Number, min: 0, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    // Embedded, not a separate collection: a campaign and its creator deals are always read together,
    // and a campaign has tens of creators at most, far from MongoDB's 16 MB document limit.
    creators: { type: [campaignCreatorSchema], default: [] },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        return ret;
      },
    },
  },
);

// Spent = sum of fees of creators who agreed to work (everything past negotiation, except declined).
campaignSchema.virtual('spent').get(function () {
  const paid: PipelineStage[] = ['contracted', 'content_review', 'published'];
  return this.creators.filter((c) => paid.includes(c.stage as PipelineStage)).reduce((sum, c) => sum + (c.fee ?? 0), 0);
});

campaignSchema.index({ status: 1, startDate: -1 });
campaignSchema.index({ 'creators.creator': 1 });

export type CampaignDoc = InferSchemaType<typeof campaignSchema>;
export const Campaign = model('Campaign', campaignSchema);
