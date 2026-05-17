import mongoose, { Schema } from "mongoose";
import { defineModel } from "@/lib/mongoose-model";

export interface WebhookEventDocument {
  source: "paymongo";
  eventId: string;
  type: string;
  receivedAt: Date;
  expiresAt: Date;
}

const WebhookEventSchema = new Schema<WebhookEventDocument>(
  {
    source: { type: String, required: true },
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    receivedAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false }
);

WebhookEventSchema.index({ source: 1, eventId: 1 }, { unique: true });
WebhookEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const WebhookEvent = defineModel<WebhookEventDocument>("WebhookEvent", WebhookEventSchema);

export default WebhookEvent;
