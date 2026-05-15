export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED";

export type PackageCategory =
  | "WEDDING"
  | "CORPORATE"
  | "BIRTHDAY"
  | "SOCIAL"
  | "OTHER";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  image?: string;
  createdAt: Date;
}

export interface IPackage {
  _id: string;
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
}

export interface IBooking {
  _id: string;
  customerId: string;
  packageId: string;
  eventDate: Date;
  guestCount: number;
  venue: string;
  status: BookingStatus;
  totalAmount: number;
  notes?: string;
  paymentId?: string;
  createdAt: Date;
}

export interface IPayment {
  _id: string;
  bookingId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  paymongoPaymentIntentId?: string;
  createdAt: Date;
}

export interface ICompanySettings {
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
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
