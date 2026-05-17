import mongoose, { Schema, Document, Model } from "mongoose";

export interface AboutValueItem {
  title: string;
  description: string;
}

export interface AboutContent {
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  storyImage?: string;
  storyParagraphs?: string[];
  values?: AboutValueItem[];
  ctaTitle?: string;
  ctaText?: string;
}

export interface ContactContent {
  headline?: string;
  subheadline?: string;
  businessHours?: string;
  mapEmbedUrl?: string;
}

export interface WhyChooseUsItem {
  title: string;
  description: string;
}

export interface HomeContent {
  whyChooseUs?: {
    title?: string;
    items?: WhyChooseUsItem[];
    images?: string[];
  };
}

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
  about?: AboutContent;
  contact?: ContactContent;
  home?: HomeContent;
  updatedAt: Date;
}

const AboutValueSchema = new Schema<AboutValueItem>(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const AboutSchema = new Schema<AboutContent>(
  {
    heroTitle: { type: String },
    heroSubtitle: { type: String },
    heroImage: { type: String },
    storyImage: { type: String },
    storyParagraphs: { type: [String], default: undefined },
    values: { type: [AboutValueSchema], default: undefined },
    ctaTitle: { type: String },
    ctaText: { type: String },
  },
  { _id: false }
);

const ContactSchema = new Schema<ContactContent>(
  {
    headline: { type: String },
    subheadline: { type: String },
    businessHours: { type: String },
    mapEmbedUrl: { type: String },
  },
  { _id: false }
);

const WhyChooseUsItemSchema = new Schema<WhyChooseUsItem>(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const WhyChooseUsSchema = new Schema(
  {
    title: { type: String },
    items: { type: [WhyChooseUsItemSchema], default: undefined },
    images: { type: [String], default: undefined },
  },
  { _id: false }
);

const HomeSchema = new Schema<HomeContent>(
  {
    whyChooseUs: { type: WhyChooseUsSchema, default: () => ({}) },
  },
  { _id: false }
);

const CompanySettingsSchema = new Schema<CompanySettingsDocument>(
  {
    name: { type: String, default: "Camilo's Catering" },
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
    about: { type: AboutSchema, default: () => ({}) },
    contact: { type: ContactSchema, default: () => ({}) },
    home: { type: HomeSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const CompanySettings: Model<CompanySettingsDocument> =
  mongoose.models.CompanySettings ??
  mongoose.model<CompanySettingsDocument>("CompanySettings", CompanySettingsSchema);

export default CompanySettings;
