# Current Task

_No active task. Next time you start non-trivial work, replace this section with the plan._

---

## Recently completed

### Tier 2 redesign — photo-driven discovery + guided booking + status-aware detail

#### Admin
- Added Photo upload (`ImageUploadField`) and a Featured toggle to the package modal. Wedding inclusions enforcement preserved.
- Loosened `imageUrl` validation in `lib/validations.ts` to accept either `https://` URLs or `/`-rooted paths so local uploads pass through.
- Extended `PackageData` to carry `imageUrl` and `isFeatured`.

#### Public discovery
- New shared `PackageCard` component (photo header, "Most popular" ribbon when featured, `from <price>` prefix, "best for" guest range, primary book CTA, scannable inclusions preview).
- `/services` rewritten to use `PackageCard` and to left-align category filters with horizontal scroll on mobile.

#### Booking flow
- `/book` is now a 3-step wizard: Choose package → Event details → Review.
- Stepper shows current/done state, "Continue" disabled until each step's required fields are valid.
- Sticky summary sidebar with package photo on `lg:`.
- `sessionStorage` draft on logged-out submit: stash form, redirect to `/login`, rehydrate on return so the user lands on the Review step with everything filled in.

#### Customer booking detail
- Page leads with package name + event date instead of `#ID`. ID demoted to a small mono badge.
- Right column is status-aware: PENDING → "Awaiting confirmation" + 24h note; CONFIRMED → Pay block; PAID → "You're all set" + see-you-on-date; COMPLETED → quiet thanks; CANCELLED → rebook CTA.
- Inclusions render as a 2-column checked list instead of dotted bullets.

#### Bookings list (admin + customer)
- Filter pills now scroll horizontally on mobile (was wrapping awkwardly).

### Files touched
- `lib/validations.ts`
- `app/(vendor)/dashboard/packages/package-form-modal.tsx`
- `app/(vendor)/dashboard/packages/package-manager.tsx`
- `components/shared/package-card.tsx` (new)
- `app/(public)/services/page.tsx`
- `app/(public)/book/page.tsx`
- `app/(public)/book/booking-form.tsx`
- `app/(customer)/bookings/[id]/page.tsx`
- `components/shared/booking-list.tsx`

### Verification
- `getDiagnostics`: no errors. All warnings are pre-existing tailwind v4 deprecation suggestions.
- `npm run build`: ✓ Compiled successfully in 8.8s. (Post-compile tsc OOM is a known Windows shell heap issue.)

### Deferred to Tier 3 / 4
- Vendor dashboard table layout + sparklines + clickable stat tiles
- Date-range filter on bookings list
- Vendor bookings: explicit next-action button by status (replace dropdown)
- Settings live preview pane
- Package list: photos on cards, Active/Archived tabs
