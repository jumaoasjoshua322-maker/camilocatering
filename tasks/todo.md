# Current Task

_No active task. Next time you start non-trivial work, replace this section with the plan._

---

## Recently completed

### Tier 1 redesign — premium-feel public-site lift
- Added Playfair Display alongside Inter (root layout) and applied `font-display` to public `<h1>`/`<h2>`.
- Built `components/shared/site-footer.tsx`: 4-column footer driven by `getPublicSettings()` (brand, sitemap, contact, social).
- Wired footer into `app/(public)/layout.tsx`; replaced the one-line copyright stub.
- Rewrote homepage hero to use `settings.heroImage` full-bleed with a top-down dark gradient. Copy lives bottom-left, single primary CTA in `amber-700`.
- Killed the 2×2 offset placeholder grid in Why Choose Us. Clean square aspect-ratio grid, photos hover-zoom 105%, fallback icons for empty slots.
- Tightened the amber palette: primary CTAs now `bg-amber-700 hover:bg-amber-800`. Stats band moved from `bg-amber-600` to deeper `bg-amber-900`. Removed the `from-amber-500 via-orange-600 to-amber-700` triple-color gradient from navbar logo and About CTA.
- Softened functional radii: navbar logo, footer mark, value cards, About CTA, Services book button now `rounded-lg`/`rounded-xl` instead of `rounded-2xl`.
- Replaced lucide brand icons with text glyphs (`f`, `ig`) since the installed lucide version (1.14.0) doesn't export Facebook/Instagram.

### Files touched
- `app/layout.tsx` — Playfair Display
- `app/(public)/layout.tsx` — footer wiring
- `app/(public)/page.tsx` — hero, stats, why-choose-us grid
- `app/(public)/services/page.tsx` — h1 + card heading + CTA
- `app/(public)/about/page.tsx` — h1, h2s, value cards, CTA
- `app/(public)/contact/page.tsx` — h1
- `components/shared/navbar.tsx` — logo, brand name from settings, CTA color
- `components/shared/site-footer.tsx` — new

### Verification
- `getDiagnostics`: clean across all touched files (only pre-existing tailwind v4 deprecation warnings)
- `npm run build`: ✓ Compiled successfully in 7.6s. Post-compile tsc OOM is a known Windows shell heap issue from this session, not a code regression.

### Deferred (Tier 2+)
- Photo-driven service & package cards
- 3-step booking wizard
- Status-aware customer booking detail right column
- Vendor dashboard table layout + sparklines
- Settings live preview pane
