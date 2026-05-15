# Camilo Catering — Production SaaS Platform

A complete single-company event catering booking platform built with Next.js 14, TypeScript, MongoDB, and PayMongo.

---

## Features

### Customer Features
- Browse catering packages by category (Wedding, Corporate, Birthday, Social)
- Book events with package selection and guest count validation
- Secure payment via PayMongo (card, GCash, PayMaya)
- Track booking status in real-time
- View booking history and payment receipts

### Admin/Staff Features
- Dashboard with revenue analytics and booking trends
- Manage all bookings with state machine workflow
- Create/edit/delete catering packages
- View top-performing packages
- Company settings management
- Revenue charts and performance metrics

### Technical Features
- Multi-role authentication (ADMIN, STAFF, CUSTOMER)
- Role-based access control (RBAC)
- PayMongo payment integration with webhooks
- Email notifications (mock/SMTP ready)
- Responsive mobile-first design
- Dark mode support
- Server-side rendering (SSR)
- API route protection
- MongoDB with Mongoose ODM

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + ShadCN |
| Database | MongoDB + Mongoose |
| Authentication | NextAuth.js v5 |
| Payments | PayMongo |
| Email | Nodemailer |
| Deployment | Vercel |

---

## Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd camilo-catering
npm install
```

### 2. Environment Setup
Create `.env.local`:
```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/camilo-catering

# Auth
# Local dev: leave NEXTAUTH_URL unset so localhost and 127.0.0.1 can keep separate sessions.
# Production: set NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# PayMongo
PAYMONGO_SECRET_KEY=sk_test_...
PAYMONGO_PUBLIC_KEY=pk_test_...
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_...
PAYMONGO_WEBHOOK_SECRET=whsec_...

# Email (optional)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_pass
EMAIL_FROM=noreply@camilocatering.com
```

### 3. Seed Database
```bash
npm run seed
```

This creates:
- 1 Admin account
- 1 Staff account
- 2 Customer accounts
- 8 Catering packages
- 5 Sample bookings
- Company settings

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Test Admin and Customer at the Same Time
Browser sessions are shared per origin. Two tabs both opened at `http://localhost:3000` will always use the same login cookie, so the last account you sign in with wins.

For local testing, use two different local hostnames:

| Account | URL |
|---------|-----|
| Admin/Staff | `http://admin.localhost:3000` |
| Customer | `http://customer.localhost:3000` |

This lets the browser keep separate auth cookies for each host while using the same dev server.

If your browser does not resolve `*.localhost`, use one normal tab and one private/incognito window instead.

---

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@camilocatering.com | password123 |
| STAFF | staff@camilocatering.com | password123 |
| CUSTOMER | juan@example.com | password123 |
| CUSTOMER | maria@example.com | password123 |

---

## Project Structure

```
camilo-catering/
├── app/
│   ├── (public)/          # Public pages (home, services, about, contact)
│   ├── (auth)/            # Login & register
│   ├── (customer)/        # Customer portal (bookings, checkout)
│   ├── (vendor)/          # Admin/staff dashboard
│   └── api/               # API routes
├── components/
│   ├── ui/                # Reusable UI components (Button, Card, etc.)
│   └── shared/            # Shared components (Navbar, Sidebar, etc.)
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── db.ts              # MongoDB connection
│   ├── rbac.ts            # Role-based access helpers
│   ├── validations.ts     # Zod schemas
│   └── utils.ts           # Utility functions
├── models/                # Mongoose models
├── services/              # External services (PayMongo, Email)
├── types/                 # TypeScript types
└── scripts/
    └── seed.mjs           # Database seeder
```

---

## Routes

### Public Routes
| Path | Description |
|------|-------------|
| `/` | Homepage |
| `/services` | Browse packages |
| `/about` | About page |
| `/contact` | Contact form |
| `/book` | Booking form |
| `/login` | Sign in |
| `/register` | Customer registration |

### Customer Routes (Auth Required)
| Path | Description |
|------|-------------|
| `/bookings` | My bookings |
| `/bookings/[id]` | Booking detail + payment |
| `/checkout` | PayMongo checkout |

### Admin/Staff Routes
| Path | Description |
|------|-------------|
| `/dashboard` | Overview + stats |
| `/dashboard/bookings` | Manage all bookings |
| `/dashboard/packages` | Manage packages |
| `/dashboard/analytics` | Revenue analytics |
| `/dashboard/settings` | Company settings |

---

## Payment Integration

### PayMongo Setup

1. Sign up at [paymongo.com](https://paymongo.com)
2. Get API keys from dashboard
3. Add to `.env.local`
4. Configure webhook:
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Events: `payment.paid`, `payment.failed`
5. Copy webhook secret to `.env.local`

### Test Cards
- **Success**: `4343434343434345`
- **Decline**: `4571736000000075`
- **3D Secure**: `4120000000000007`

### Payment Flow
1. Customer books event → Booking created (status: PENDING)
2. Admin confirms → Status: CONFIRMED
3. Customer pays → PayMongo payment intent created
4. Payment succeeds → Webhook updates status to PAID
5. Event completed → Admin marks as COMPLETED

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production
```env
MONGODB_URI=<production-mongodb-uri>
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<strong-secret>
PAYMONGO_SECRET_KEY=sk_live_...
PAYMONGO_PUBLIC_KEY=pk_live_...
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_live_...
PAYMONGO_WEBHOOK_SECRET=whsec_...
```

### Post-Deployment
1. Run seed script on production DB (optional)
2. Configure PayMongo webhook with production URL
3. Test payment flow with live keys
4. Update company settings via `/dashboard/settings`

---

## Database Models

### User
- Roles: ADMIN, STAFF, CUSTOMER
- Fields: name, email, password (hashed), phone

### Package
- Categories: WEDDING, CORPORATE, BIRTHDAY, SOCIAL, OTHER
- Fields: name, description, price, minGuests, maxGuests, inclusions, isFeatured

### Booking
- Status: PENDING → CONFIRMED → PAID → COMPLETED / CANCELLED
- Fields: customerId, packageId, eventDate, guestCount, venue, totalAmount

### Payment
- Status: PENDING → SUCCEEDED / FAILED / REFUNDED
- Fields: bookingId, amount, paymongoPaymentIntentId

### CompanySettings
- Single document for company info
- Fields: name, tagline, description, phone, email, address, socialLinks

---

## Development

### Build
```bash
npm run build
```

### Type Check
```bash
npx tsc --noEmit
```

### Lint
```bash
npm run lint
```

---

## License

MIT

---

## Support

For issues or questions, contact: hello@camilocatering.com
