import mongoose, { Schema, Document, Model } from "mongoose";
import type { UserRole } from "@/types";

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["ADMIN", "STAFF", "CUSTOMER"],
      default: "CUSTOMER",
    },
    phone: { type: String },
    image: { type: String },
    emailVerified: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });

const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>("User", UserSchema);

export default User;
