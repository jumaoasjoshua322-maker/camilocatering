import mongoose, { Schema } from "mongoose";
import { defineModel } from "@/lib/mongoose-model";

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

const RateLimitHit = defineModel<RateLimitHitDocument>("RateLimitHit", RateLimitHitSchema);

export default RateLimitHit;
