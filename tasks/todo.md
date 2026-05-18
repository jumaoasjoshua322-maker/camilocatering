# Current Task

_No active task. Next time you start non-trivial work, replace this section with the plan._

---

## Recently completed

### Tier 4 redesign — admin Settings polish (final cohort)

#### Live preview pane
- New `SettingsPreviewPane` client component shows an `<iframe>` of `/`, `/about`, or `/contact`, keyed to the active settings tab.
- Refreshes when the active tab changes, and again on every successful save (cache-bust via `?_p=<timestamp>`). Unsaved keystrokes are not reflected — copy explains this so the admin doesn't get confused.
- Settings page is now a 12-column grid on `lg+`: form on the left (cols 1–7), preview on the right (cols 8–12). Hidden on smaller viewports — preview is desktop-only.
- Preview header includes manual "open in new tab" link as a fallback.

#### Per-slot image hints
- `ImageUploadField` accepts an optional `recommended` prop that renders a second hint line.
- Concrete hints applied to every slot:
  - Logo: 256×256, square, shown at 36px.
  - Site Hero: 1920×1080+ landscape, cropped on tall screens.
  - Story Image: 1280×720 landscape.
  - Why Choose Us tiles: 800×800 square per slot.
  - Package Photo: 1280×720 landscape, center the food.

#### Save bar
- Moved from `sticky bottom-4` floating to a true in-form footer that lives at the bottom of the form column. Soft fade-out gradient so it doesn't crash into content visually. Stays sticky inside the form region instead of overlapping arbitrary content.
- Removed the "Preview /about ↗" / "Preview /contact ↗" links from the bar — the live preview pane (and its in-header "open in new tab") replaces them.

#### Security note
- `next.config.ts`: loosened CSP `frame-ancestors` from `'none'` to `'self'`, and `X-Frame-Options` from `DENY` to `SAMEORIGIN`, so the admin can iframe the public site. Cross-origin embedding still blocked. Documented in `SECURITY.md`.

### Files touched
- `components/ui/image-upload.tsx`
- `app/(vendor)/dashboard/settings/settings-preview-pane.tsx` (new)
- `app/(vendor)/dashboard/settings/company-settings-form.tsx`
- `app/(vendor)/dashboard/settings/page.tsx`
- `app/(vendor)/dashboard/packages/package-form-modal.tsx`
- `next.config.ts`
- `SECURITY.md`

### Verification
- `getDiagnostics`: no errors (only pre-existing tailwind v4 deprecation warnings).
- `npm run build`: ✓ Compiled successfully in 8.2s.

---

## Redesign roadmap status

- ✅ Tier 1 — premium-feel public site lift
- ✅ Tier 2 — photo-driven discovery, 3-step booking wizard, status-aware customer detail
- ✅ Tier 3 — operational vendor dashboard (clickable KPIs, sparklines, table, next-action buttons, date-range filter)
- ✅ Tier 4 — admin Settings polish (live preview, image hints, in-form save bar)

All four tiers shipped. Public site, customer flows, vendor dashboard, and CMS are at coherent product-ready quality.
