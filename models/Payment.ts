import mongoose, { Schema, Document, Model } from "mongoose";

export interface PaymentDocument extends Document {
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  paymongoPaymentIntentId?: string;
  paymongoClientKey?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "php" },
    status: {
      type: String,
      enum: ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    stripePaymentIntentId: { type: String, index: true },
    stripeClientSecret: { type: String },
    paymongoPaymentIntentId: { type: String, index: true },
    paymongoClientKey: { type: String },
    metadata: { type: Map, of: String },
  },
  { timestamps: true }
);

const Payment: Model<PaymentDocument> =
  mongoose.models.Payment ??
  mongoose.model<PaymentDocument>("Payment", PaymentSchema);

export default Payment;
