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
