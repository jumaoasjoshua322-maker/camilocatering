import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy.
 *
 * - 'unsafe-inline' on script-src is still needed by Next 16 (its bootstrap
 *   inline). Switching to a per-request nonce is on the roadmap.
 * - 'unsafe-eval' is required only by the dev React refresh runtime; it is
 *   removed in production builds.
 * - Allow PayMongo for connect-src (payment intents) and as a frame source
 *   (3DS challenge pages). Allow google.com/maps for the contact map embed.
 */
function csp() {
  const scriptSrc = ["'self'", "'unsafe-inline'", isDev ? "'unsafe-eval'" : ""].filter(Boolean);
  return [
    "default-src 'self'",
    "base-uri 'self'",
    // Same-origin only — required so /dashboard/settings can iframe the
    // public site for live preview. Cross-origin embedding still blocked.
    "frame-ancestors 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc.join(" ")}`,
    "connect-src 'self' https://api.paymongo.com",
    "frame-src 'self' https://www.google.com https://*.paymongo.com",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // SAMEORIGIN (not DENY) so the admin Settings page can iframe the public
  // site for live preview. Modern browsers respect frame-ancestors over
  // X-Frame-Options when both are present, but we set both for legacy.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: csp() },
];

const allowedServerActionOrigins = (process.env.APP_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.replace(/^https?:\/\//, "").trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    localPatterns: [
      { pathname: "/uploads/**" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: {
      // In development we still allow the local dev hosts so two-tab testing works.
      allowedOrigins: isDev
        ? [
            "localhost:3000",
            "127.0.0.1:3000",
            "admin.localhost:3000",
            "customer.localhost:3000",
            ...allowedServerActionOrigins,
          ]
        : allowedServerActionOrigins,
    },
  },
};

export default nextConfig;
