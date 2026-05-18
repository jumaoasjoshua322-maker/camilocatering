# Current Task

_No active task. Next time you start non-trivial work, replace this section with the plan._

---

## Recently completed

### Tier 3 redesign — operational vendor dashboard

#### Dashboard overview
- Stat tiles are now `<Link>`s. Each tile navigates to the most useful filtered view: Total Bookings → all bookings, **Pending Review → status=PENDING (with pulsing alert dot when > 0)**, Active Packages → /dashboard/packages, Total Customers → all bookings, Total Revenue → /dashboard/analytics.
- Two of the tiles plus the wide Revenue tile carry a **14-day sparkline** built with the existing `recharts` dep through a new `KpiSparkline` primitive. Zero-filled days so quiet stretches still render.
- Welcome line surfaces a "X bookings need your review" deep-link when pending count > 0.
- "Recent bookings" card is now a real `<table>` on `lg:` (sticky header columns: Status / Customer / Package / Event date / Amount), cards on mobile. View all link in the header.

#### Bookings list
- New URL-driven date range filter: `?range=next30 | upcoming | past30 | all`. Vendor only (customers usually have a handful of bookings, the filter is noise).
- Replaced the "Update Status" dropdown with an explicit primary button per status:
  - PENDING → Confirm booking
  - CONFIRMED → Mark as paid
  - PAID → Mark complete
- Cancel stays as a quiet destructive action on PENDING/CONFIRMED.
- Removed the now-dead local `TRANSITIONS` map (server still enforces the full table in `/api/bookings/[id]`).

#### API
- `GET /api/bookings` accepts `?range=`, validated, mapped to a `eventDate` window. Invalid values 400.

### Files touched
- `components/ui/kpi-sparkline.tsx` (new)
- `app/(vendor)/dashboard/page.tsx`
- `components/shared/booking-list.tsx`
- `app/api/bookings/route.ts`

### Verification
- `getDiagnostics`: no errors (one pre-existing tailwind v4 deprecation warning).
- `npm run build`: ✓ Compiled successfully in 8.3s.

### Deferred to Tier 4
- Settings live preview pane (split editor 60/40 with `<iframe>`)
- Per-image upload hints (recommended dimensions per slot)
- Sticky save bar → in-form footer
