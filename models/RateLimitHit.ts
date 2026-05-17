import mongoose, { Schema, Model } from "mongoose";

export interface RateLimitHitDocument {
  key: string;
  count: number;
  resetAt: Date;
}

const RateLimitHitSchema = new Schema<RateLimitHitDocument>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    resetAt: { type: Date, required: true },
  },
  { timestamps: false }
);

// Auto-delete documents whose window has expired.
RateLimitHitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const RateLimitHit: Model<RateLimitHitDocument> =
  mongoose.models.RateLimitHit ??
  mongoose.model<RateLimitHitDocument>("RateLimitHit", RateLimitHitSchema);

export default RateLimitHit;
