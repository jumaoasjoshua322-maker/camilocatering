import mongoose, { Schema, Document } from "mongoose";
import { defineModel } from "@/lib/mongoose-model";
import type { BookingStatus } from "@/types";

export interface BookingDocument extends Document {
  customerId: mongoose.Types.ObjectId;
  packageId: mongoose.Types.ObjectId;
  eventDate: Date;
  guestCount: number;
  venue: string;
  status: BookingStatus;
  totalAmount: number;
  notes?: string;
  paymentId?: mongoose.Types.ObjectId;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<BookingDocument>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    eventDate: { type: Date, required: true },
    guestCount: { type: Number, required: true, min: 1 },
    venue: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "PAID", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    totalAmount: { type: Number, required: true },
    notes: { type: String },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

BookingSchema.index({ status: 1, eventDate: 1 });
BookingSchema.index({ customerId: 1, status: 1 });
BookingSchema.index({ packageId: 1, status: 1, paidAt: -1 });

const Booking = defineModel<BookingDocument>("Booking", BookingSchema);

export default Booking;
