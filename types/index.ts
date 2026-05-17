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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
