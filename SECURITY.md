# Security Notes

This document captures the security posture of the app and what an operator must do before deploying it publicly. Treat it as a checklist.

## Code-level controls in place

- NextAuth v5 with bcrypt-hashed passwords and JWT sessions.
- Mongo-backed sliding-window rate limiter (`lib/rate-limit.ts`) on login, register, contact, payment, upload.
- Same-origin (Origin / Referer) check (`lib/security.ts`) on every mutating API route to mitigate CSRF.
- Booking and payment status changes use compare-and-swap on the document so a race cannot drop a transition.
- PayMongo webhook verifies HMAC-SHA256 over `${timestamp}.${rawBody}` with timing-safe equality, rejects signatures older than 5 minutes, and dedupes events for 7 days via a unique `eventId`.
- File uploads are admin-only, capped at 5 MB, and validated by inspecting the file's leading magic bytes (not the client-asserted MIME).
- Local payment stub is gated behind `ENABLE_LOCAL_PAYMENT=1` and returns 503 in any other environment.
- Strict security headers including HSTS preload, **frame-ancestors 'self' / X-Frame-Options SAMEORIGIN** (loosened from `none`/`DENY` so the admin Settings page can iframe the public site for live preview — cross-origin embedding is still blocked), COOP, CORP, no-sniff, and a CSP that drops `unsafe-eval` in production.
- `seed.mjs` refuses to run with `NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED=1`.

## Required environment variables

```env
MONGODB_URI=...                    # see Atlas section below
NEXTAUTH_SECRET=...                # 32+ random bytes (openssl rand -base64 32)
NEXTAUTH_URL=https://yourdomain    # production only; leave unset in local dev
APP_ALLOWED_ORIGINS=https://yourdomain[,https://admin.yourdomain]
PAYMONGO_SECRET_KEY=sk_live_...
PAYMONGO_PUBLIC_KEY=pk_live_...
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_live_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=hello@yourdomain
# ENABLE_LOCAL_PAYMENT=1           # NEVER set in production
```

## MongoDB Atlas hardening

1. Create a dedicated database user with role `readWrite` scoped to the `camilo-catering` database only. Do not reuse the cluster admin user.
2. Restrict Network Access to your hosting platform's egress IPs (Vercel: their static IPs, or set up Atlas Private Endpoint for AWS/Azure/GCP backends).
3. Enable database auditing if your tier supports it.
4. Rotate the database password whenever a former operator loses access or `.env.local` is exposed.

## Things to do before public launch (not yet implemented)

- Wire the real PayMongo flow in `app/api/payments/create/route.ts`: create a `payment_intent`, return its `client_key`, let the client confirm with Card / GCash / PayMaya, and rely on the webhook (not the client) to flip the booking to PAID.
- Email verification on register and a self-serve password reset flow. The User model already has an `emailVerified` field that is currently unused.
- A token-version field on User, bumped on password change so other sessions are revoked.
- A CAPTCHA (hCaptcha or Cloudflare Turnstile) on `/register` and `/contact`.
- Replace `console.error` in API handlers with a structured logger that redacts PII and headers.
- An audit log collection capturing admin mutations (status changes, package edits, settings edits).
- Move uploads to Vercel Blob, Cloudinary, or S3. The local `/public/uploads` directory does not survive a Vercel deploy. The storage abstraction in `services/storage.ts` is the only file that needs to change.

## Known dependency advisories

`npm audit` reports moderate advisories in `nodemailer` and a transitive `postcss`. Neither is exploitable in current usage:

- `nodemailer ≤ 8.0.4` SMTP command injection requires attacker control over `envelope.size` or the transport name. We use neither.
- `postcss < 8.5.10` XSS is a build-time concern, not runtime exposure.

Upgrade when patches compatible with `next-auth` v5 ship.
