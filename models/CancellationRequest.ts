import mongoose, { Schema, Document, Model } from "mongoose";

export interface CancellationRequestDocument extends Document {
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  reason: string;
  status: "OPEN" | "RESOLVED" | "DECLINED";
  createdAt: Date;
  updatedAt: Date;
}

const CancellationRequestSchema = new Schema<CancellationRequestDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["OPEN", "RESOLVED", "DECLINED"],
      default: "OPEN",
      index: true,
    },
  },
  { timestamps: true }
);

CancellationRequestSchema.index({ bookingId: 1, status: 1 });

const CancellationRequest: Model<CancellationRequestDocument> =
  mongoose.models.CancellationRequest ??
  mongoose.model<CancellationRequestDocument>("CancellationRequest", CancellationRequestSchema);

export default CancellationRequest;
