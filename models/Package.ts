import mongoose, { Schema, Document } from "mongoose";
import { defineModel } from "@/lib/mongoose-model";
import type { PackageCategory } from "@/types";

export interface PackageDocument extends Document {
  name: string;
  description: string;
  category: PackageCategory;
  price: number;
  minGuests: number;
  maxGuests: number;
  inclusions: string[];
  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<PackageDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["WEDDING", "CORPORATE", "BIRTHDAY", "SOCIAL", "OTHER"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    minGuests: { type: Number, required: true, min: 1 },
    maxGuests: { type: Number, required: true },
    inclusions: [{ type: String }],
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

PackageSchema.index({ category: 1, isActive: 1 });
PackageSchema.index({ isFeatured: 1 });

const Package = defineModel<PackageDocument>("Package", PackageSchema);

export default Package;
