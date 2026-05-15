import mongoose, { Schema, Document, Model } from "mongoose";

export interface CompanySettingsDocument extends Document {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  logo?: string;
  heroImage?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
  };
  updatedAt: Date;
}

const CompanySettingsSchema = new Schema<CompanySettingsDocument>(
  {
    name: { type: String, default: "Camilo Catering" },
    tagline: { type: String, default: "Premium Catering for Every Occasion" },
    description: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    logo: { type: String },
    heroImage: { type: String },
    socialLinks: {
      facebook: { type: String },
      instagram: { type: String },
    },
  },
  { timestamps: true }
);

const CompanySettings: Model<CompanySettingsDocument> =
  mongoose.models.CompanySettings ??
  mongoose.model<CompanySettingsDocument>("CompanySettings", CompanySettingsSchema);

export default CompanySettings;
