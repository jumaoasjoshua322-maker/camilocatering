# Camilo's Catering

Single-company event catering booking platform. Customers browse
packages and book events; admins confirm bookings, manage packages,
and edit the public-facing CMS content.

Built as a portfolio project. Production-ready in shape and security
posture, but a few integrations are stubbed for local development —
see [Status](#status) below.

---

## Status

| Area | State |
|------|-------|
| Auth (NextAuth v5, JWT, bcrypt) | Implemented |
| RBAC (ADMIN / STAFF / CUSTOMER) | Implemented |
| Booking state machine + admin actions | Implemented |
| Mongo-backed rate limiting | Implemented |
| CSRF / Origin checks on mutations | Implemented |
| File uploads (5 MB cap, magic-byte sniff) | Implemented (local disk) |
| Webhook signature verification + idempotency | Implemented |
| Admin CMS for About / Contact / Homepage | Implemented |
| Analytics with date-range filters | Implemented |
| **PayMongo online payments** | **Stub.** Gated by `ENABLE_LOCAL_PAYMENT=1`; returns 503 in any other environment. Real flow not yet wired. |
| **Email (booking confirmation, contact form)** | **Logged in dev** if SMTP isn't configured; nodemailer-ready when `SMTP_*` env vars are set. |
| **Email verification & password reset** | **Not implemented.** |
| **CAPTCHA on register / contact** | **Not implemented.** |
| Image storage on Vercel | Local `/public/uploads`; doesn't survive deploys. Swap `services/storage.ts` for Vercel Blob / Cloudinary / S3 when deploying. |

See [SECURITY.md](./SECURITY.md) for the full security posture and the
required hardening steps before public deployment.

---

## Tech stack

- Next.js 16 (App Router) + TypeScript
- MongoDB + Mongoose
- NextAuth v5
- Tailwind CSS v4 + Radix UI primitives
- Recharts for analytics
- Zod for input validation
- Nodemailer for SMTP

---

## Quick start

```bash
git clone <your-repo>
cd camilo-catering
npm install
cp .env.local.example .env.local   # fill in Mongo URI + NEXTAUTH_SECRET
npm run seed                        # creates demo data
npm run dev
```

Open http://localhost:3000.

### Required env vars

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/camilo-catering
NEXTAUTH_SECRET=<openssl rand -base64 32>

# Local-only switch. Never set in production.
ENABLE_LOCAL_PAYMENT=1

# Optional in development. Required for real emails.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@camilocatering.com | password123 |
| STAFF | staff@camilocatering.com | password123 |
| CUSTOMER | juan@example.com | password123 |
| CUSTOMER | maria@example.com | password123 |

To test admin and customer side-by-side without a session collision,
use two different hostnames:
`http://admin.localhost:3000` and `http://customer.localhost:3000`.
Or use a regular tab plus an incognito window.

---

## Project structure

```
camilo-catering/
├── app/
│   ├── (public)/    Public pages (home, services, about, contact, book)
│   ├── (auth)/      Login, register
│   ├── (customer)/  Customer portal (bookings, checkout)
│   ├── (vendor)/    Admin/staff dashboard
│   └── api/         API routes (REST + webhooks)
├── components/
│   ├── ui/          Reusable primitives (Button, Card, ImageUploadField, ...)
│   └── shared/      Cross-route components (Navbar, BookingList, ...)
├── lib/             Auth, db, rbac, validations, settings hydrator, security helpers
├── models/          Mongoose models
├── services/        Storage, email, PayMongo
├── types/           Shared types
├── public/uploads/  Admin-uploaded media (gitignored)
├── proxy.ts         NextAuth middleware
└── tasks/           Operating notes for autonomous-agent collaborators
```

---

## Routes

| Path | Role | Notes |
|------|------|-------|
| `/`, `/about`, `/contact`, `/services`, `/book` | Public | All CMS-driven |
| `/login`, `/register` | Public | NextAuth credentials |
| `/bookings`, `/bookings/[id]` | Customer | List + detail |
| `/checkout` | Customer | PayMongo handoff (stubbed) |
| `/dashboard` | Admin/Staff | Overview |
| `/dashboard/bookings` | Admin/Staff | Manage all bookings |
| `/dashboard/packages` | Admin | CRUD packages |
| `/dashboard/analytics` | Admin/Staff | Revenue + Top Packages |
| `/dashboard/settings` | Admin | Company info, branding, About / Contact / Homepage CMS |

---

## Booking lifecycle

```
PENDING ──confirm──> CONFIRMED ──pay──> PAID ──complete──> COMPLETED
   └──────────────cancel────────────────────────cancel─────┘
```

State transitions are enforced server-side with compare-and-swap:
`findOneAndUpdate({ _id, status: from }, { $set: { status: to } })`,
so concurrent updates return 409 instead of corrupting state.

`paidAt` is stamped at every transition into `PAID` (admin PATCH,
payment-create stub, and PayMongo webhook).

---

## PayMongo wiring (when ready)

1. Sign up at [paymongo.com](https://paymongo.com)
2. Add the keys to `.env.local`:
   ```
   PAYMONGO_SECRET_KEY=sk_test_...
   PAYMONGO_PUBLIC_KEY=pk_test_...
   NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_...
   PAYMONGO_WEBHOOK_SECRET=whsec_...
   ```
3. Configure the webhook in the PayMongo dashboard:
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Events: `payment.paid`, `payment.failed`
4. Replace the body of `app/api/payments/create/route.ts` with a real
   `paymongo.createPaymentIntent` call. The webhook handler is already
   correct (HMAC-SHA256 over `${timestamp}.${rawBody}`, replay window
   5 min, deduped 7 days via `WebhookEvent`).
5. Remove `ENABLE_LOCAL_PAYMENT` from your production env.

---

## Development

```bash
npm run dev      # local server
npm run build    # production build
npm run lint     # eslint
npx tsc --noEmit # type-check only
npm run seed     # reseed demo data (refuses in production)
```

---

## License

MIT
