import { auth } from "@/lib/auth";
import type { UserRole } from "@/types";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

export async function requireRole(...roles: UserRole[]) {
  const session = await auth();
  if (!session?.user) return null;
  if (!roles.includes(session.user.role)) return null;
  return session.user;
}

export function isAdmin(role: UserRole) {
  return role === "ADMIN";
}

export function isStaff(role: UserRole) {
  return role === "ADMIN" || role === "STAFF";
}

export function isCustomer(role: UserRole) {
  return role === "CUSTOMER";
}
