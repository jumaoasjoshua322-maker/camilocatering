import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const packageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(["WEDDING", "CORPORATE", "BIRTHDAY", "SOCIAL", "OTHER"]),
  price: z.coerce.number().positive("Price must be positive"),
  minGuests: z.coerce.number().int().positive("Min guests must be positive"),
  maxGuests: z.coerce.number().int().positive("Max guests must be positive"),
  inclusions: z.array(z.string().min(1)).min(1, "At least one inclusion required"),
  imageUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
}).refine((d) => d.maxGuests >= d.minGuests, {
  message: "Max guests must be >= min guests",
  path: ["maxGuests"],
});

export const bookingSchema = z.object({
  packageId: z.string().min(1, "Package is required"),
  eventDate: z.string().refine((d) => new Date(d) > new Date(), {
    message: "Event date must be in the future",
  }),
  guestCount: z.coerce.number().int().positive("Guest count must be positive"),
  venue: z.string().min(3, "Venue must be at least 3 characters"),
  notes: z.string().optional(),
});

export const companySettingsSchema = z.object({
  name: z.string().min(2),
  tagline: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
  }).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PackageInput = z.infer<typeof packageSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
