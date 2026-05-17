# Current Task

_No active task. Next time you start non-trivial work, replace this section with the plan._

---

## Template

### Goal
One sentence describing what we're shipping.

### Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

### Verification
- [ ] Type check passes
- [ ] Build passes
- [ ] Manual test against the running app

### Review
_Filled in after the task is done. Two-sentence summary, what changed, what was deferred, follow-ups._

---

## Recently completed

Brief log of recent shipped work, newest first. Trim entries older than ~10 commits.

### `3261919` Integrate Boris Cherny CLAUDE.md template
Adopted the workflow + task management + core principles checklist into `CLAUDE.md` and added `tasks/` scaffolding so future sessions can plan and capture lessons.

### `ba59b9d` Admin-editable "Why Choose Us" homepage section
Extended `CompanySettings.home.whyChooseUs` (title, items, 4 image slots), added a Homepage tab in admin Settings, made the public homepage read from the CMS with icon-tile fallbacks for empty image slots.

### `012dad5` Fix uploaded images not visible
Two real bugs: middleware was redirecting `/uploads/*` to login, and Next 16 image optimizer needed `images.localPatterns` to allow local paths. Both were one-line config fixes.

### `f7bd742` Make image upload + save flow obvious
Rebuilt `ImageUploadField` with full-area click target, drag-and-drop, hover Replace overlay, prominent error badge. Added dirty-state sticky save bar with Discard and beforeunload warning so admins know an upload alone isn't persisted.

### `e7522d9` Date range filter on Top Packages
Added `Booking.paidAt`, set in webhook + admin status PATCH + payment-create. Pivoted aggregation to start from Booking, group by packageId, then $lookup. Range filter (30d / 90d / YTD / all) drives the card.
