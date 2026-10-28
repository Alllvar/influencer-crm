import { Schema, model, Types, type InferSchemaType } from 'mongoose';

export const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitch', 'x'] as const;
export type Platform = (typeof PLATFORMS)[number];

const creatorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    handle: { type: String, required: true, trim: true },
    platform: { type: String, enum: PLATFORMS, required: true },
    email: { type: String, trim: true, lowercase: true },
    country: { type: String, trim: true },
    niches: { type: [String], default: [] },
    followers: { type: Number, required: true, min: 0 },
    engagementRate: { type: Number, min: 0, max: 100, default: 0 },
    avatarUrl: { type: String },
    notes: { type: String, default: '' },
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

// One creator account per platform handle.
creatorSchema.index({ platform: 1, handle: 1 }, { unique: true });
// Supports the default list sort and "top creators" queries.
creatorSchema.index({ followers: -1 });

export type CreatorDoc = InferSchemaType<typeof creatorSchema>;
export const Creator = model('Creator', creatorSchema);
