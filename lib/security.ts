import { NextRequest } from "next/server";

/**
 * Returns true if the request comes from an allowed origin.
 *
 * Strategy: trust the host header (set by the platform), and require any
 * present Origin or Referer to match. GET/HEAD/OPTIONS skip the check.
 *
 * Allowed origins can be expanded via APP_ALLOWED_ORIGINS (comma-separated)
 * for things like the Vercel preview URL or admin subdomain.
 */
export function isSameOrigin(req: NextRequest | Request): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  // No host header at all: extremely unusual, deny.
  if (!host) return false;

  const allowed = new Set<string>();
  allowed.add(`https://${host}`);
  allowed.add(`http://${host}`);

  const extra = process.env.APP_ALLOWED_ORIGINS;
  if (extra) {
    for (const o of extra.split(",").map((s) => s.trim()).filter(Boolean)) {
      allowed.add(o);
    }
  }

  // Most browsers send Origin on POST/PUT/PATCH/DELETE.
  if (origin) return allowed.has(origin);

  // Some legacy or privacy-stripped requests only send Referer.
  if (referer) {
    try {
      const u = new URL(referer);
      return allowed.has(`${u.protocol}//${u.host}`);
    } catch {
      return false;
    }
  }

  // No Origin and no Referer on a state-changing request is suspicious.
  return false;
}
