import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .max(128)
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/\d/, "Password must include a number"),
  phone: z.string().trim().max(30).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const packageSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000),
  category: z.enum(["WEDDING", "CORPORATE", "BIRTHDAY", "SOCIAL", "OTHER"]),
  price: z.coerce.number().positive("Price must be positive"),
  minGuests: z.coerce.number().int().positive("Min guests must be positive"),
  maxGuests: z.coerce.number().int().positive("Max guests must be positive"),
  inclusions: z.array(z.string().trim().min(1).max(200)).min(1, "At least one inclusion required").max(30),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isFeatured: z.boolean().optional(),
}).refine((d) => d.maxGuests >= d.minGuests, {
  message: "Max guests must be >= min guests",
  path: ["maxGuests"],
});

export const bookingSchema = z.object({
  packageId: objectIdSchema,
  eventDate: z.string().refine((d) => new Date(d) > new Date(), {
    message: "Event date must be in the future",
  }),
  guestCount: z.coerce.number().int().positive("Guest count must be positive"),
  venue: z.string().trim().min(3, "Venue must be at least 3 characters").max(300),
  notes: z.string().trim().max(1000).optional(),
});

const optionalUrlOrPath = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"),
    "Must be a URL or a path starting with /"
  )
  .optional()
  .or(z.literal(""));

export const aboutValueItemSchema = z.object({
  title: z.string().trim().max(120).default(""),
  description: z.string().trim().max(500).default(""),
});

export const aboutContentSchema = z.object({
  heroTitle: z.string().trim().max(200).optional(),
  heroSubtitle: z.string().trim().max(1000).optional(),
  heroImage: optionalUrlOrPath,
  storyImage: optionalUrlOrPath,
  storyParagraphs: z.array(z.string().trim().max(2000)).max(20).optional(),
  values: z.array(aboutValueItemSchema).max(12).optional(),
  ctaTitle: z.string().trim().max(200).optional(),
  ctaText: z.string().trim().max(500).optional(),
});

export const contactContentSchema = z.object({
  headline: z.string().trim().max(200).optional(),
  subheadline: z.string().trim().max(500).optional(),
  businessHours: z.string().trim().max(200).optional(),
  mapEmbedUrl: optionalUrlOrPath,
});

export const companySettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().trim().max(500).optional(),
  logo: optionalUrlOrPath,
  heroImage: optionalUrlOrPath,
  socialLinks: z.object({
    facebook: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
  }).optional(),
  about: aboutContentSchema.optional(),
  contact: contactContentSchema.optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PackageInput = z.infer<typeof packageSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type AboutContentInput = z.infer<typeof aboutContentSchema>;
export type ContactContentInput = z.infer<typeof contactContentSchema>;

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
