import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import RateLimitHit from "@/models/RateLimitHit";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

export function getClientIp(req?: NextRequest | Request | null) {
  const headers = req?.headers;
  return (
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers?.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Distributed sliding-window rate limiter backed by MongoDB.
 *
 * Atomic increment when a window is active; otherwise opens a new window.
 * Documents auto-expire via TTL on `resetAt`.
 *
 * Failure mode: if the database is unreachable we fail-open (allow the
 * request) and log. Locking out users when the DB is having a bad day is
 * worse than a brief reduction in throttling.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    await connectDB();
    const now = new Date();

    // 1) Try to increment within an active window.
    const incremented = await RateLimitHit.findOneAndUpdate(
      { key, resetAt: { $gt: now } },
      { $inc: { count: 1 } },
      { new: true }
    );

    if (incremented) {
      if (incremented.count > limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: incremented.resetAt.getTime() - now.getTime(),
        };
      }
      return { allowed: true, remaining: Math.max(0, limit - incremented.count) };
    }

    // 2) No active window - reset (last writer wins on race, acceptable).
    const newResetAt = new Date(now.getTime() + windowMs);
    await RateLimitHit.findOneAndUpdate(
      { key },
      { $set: { count: 1, resetAt: newResetAt } },
      { upsert: true }
    );
    return { allowed: true, remaining: limit - 1 };
  } catch (err) {
    console.error("[RATE_LIMIT_FAIL_OPEN]", err);
    return { allowed: true, remaining: limit };
  }
}
