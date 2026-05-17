import mongoose, { Schema, Document } from "mongoose";
import { defineModel } from "@/lib/mongoose-model";

export interface PaymentDocument extends Document {
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
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
    paymongoPaymentIntentId: { type: String, index: true },
    paymongoClientKey: { type: String },
    metadata: { type: Map, of: String },
  },
  { timestamps: true }
);

const Payment = defineModel<PaymentDocument>("Payment", PaymentSchema);

export default Payment;
