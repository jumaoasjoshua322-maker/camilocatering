# Lessons

Append-only log. Newest at the top. Read at session start.

Format:
- **Date · short title** — what went wrong, the rule that prevents it.

---

## 2026-05-18 · React 19 / Compiler `set-state-in-effect` is overly strict

**What went wrong.** During the `BookingList` move, the React Compiler's `set-state-in-effect` rule flagged the standard data-fetch effect: `useEffect(() => { fetchBookings(); }, [fetchBookings])` where `fetchBookings` calls `setLoading(true)` synchronously on entry. I tried two refactors to satisfy the rule (AbortController + extracted setLoading) and the rule kept flagging the call site through `useCallback`. The project ships with this same warning everywhere we have a "fetch on mount" effect.

**Rule.** This rule cannot follow `// eslint-disable-next-line` directives because it's enforced by Next 16's React Compiler, not ESLint. **Don't refactor working data-fetch effects to chase this warning** — the runtime behavior matches React's own docs. Treat it as a known editor noise. If we ever migrate to React Server Component-only data fetching, the warnings will go away naturally.

---

## 2026-05-18 · `git add -A` swept up unrelated working-tree changes

**What went wrong.** I ran `git add -A` to stage docs files and accidentally swept up an unrelated `lib/mongoose-model.ts` + a refactor of every model that had been sitting in the working tree (probably from an earlier autosave or hook). The commit message claimed it was just a docs change, but the diff included a real schema change. The model refactor is good code, but bundling it under a docs commit is dishonest history.

**Rule.** Before committing, **always run `git status --short` and explicitly stage only what the commit message describes**. Use `git add <path>` per file; reserve `git add -A` for moments when you've personally just touched everything in the diff. If unrelated changes exist in the working tree, commit them separately with their own message first, or stash them.

---

## 2026-05-18 · Image upload broken on both edges

**What went wrong.** Backend was returning 201 with valid URLs, files landed on disk, but the browser showed a broken-image icon. I assumed the backend was the suspect and almost re-validated the magic-byte sniff before tracing.

**Root cause.** Two unrelated bugs in the request path:
1. `proxy.ts` middleware matcher excluded `_next/static` and a couple of file extensions, but not `/uploads/*`. So `<img src="/uploads/x.jpg">` went through auth middleware and got 307'd to `/login?callbackUrl=...`.
2. Next 16 image optimizer rejects local paths unless `images.localPatterns` whitelists them.

**Rule.** For "image not visible" reports, **trace with curl** (direct path + `/_next/image?url=...`) before suspecting the upload code. The HTTP layer (middleware, optimizer, CSP) fails image requests in ways that look like rendering bugs.

---

## 2026-05-18 · MongoDB URI without database name

**What went wrong.** The user's connection string was `mongodb+srv://.../?appName=...` with no path. Mongo defaults to the `test` database. After I added `/camilo-catering` to the URI, the seeded data appeared to vanish — it was actually still in `test`.

**Rule.** When changing a Mongo URI's database path, check the cluster for orphaned databases (`db.admin().listDatabases()`) before assuming the user's data was deleted. Always offer to copy or re-point rather than assuming the new database is the canonical one.

---

## 2026-05-18 · Package modal silently failed to submit

**What went wrong.** `package-form-modal.tsx` built a `payload` that included `inclusions`, then validated `values` (which never has `inclusions`). Zod schema requires `inclusions.min(1)` so `safeParse(values)` always returned `success:false` and the form bailed before fetching. Looked like the button did nothing.

**Rule.** When a form merges form-state with derived data into a payload, **validate the merged payload, not the form state alone**. If the schema rejects fields the form doesn't track, the form is broken silently.

---

## 2026-05-18 · Duplicate "My Bookings" in user menu

**What went wrong.** For customers, the dashboard link resolved to `/bookings` and labeled itself "My Bookings", then a second explicit `/bookings` link rendered right after — both labeled "My Bookings". The duplication was hidden from admins because the second link was role-gated.

**Rule.** When a UI element conditionally changes its destination by role, don't add a second element for one of those roles. Make the single element role-aware (icon + label + href) instead of stacking a second one.

---

## 2026-05-18 · CSRF defense doesn't apply to multipart by accident

**What went wrong.** I almost shipped a same-origin check that relied on `Content-Type: application/json` not being a CORS-simple type. `/api/uploads` accepts `multipart/form-data`, which IS a simple type. Without explicit Origin/Referer enforcement, that route was the real CSRF target.

**Rule.** When auditing CSRF posture, **enumerate routes by content type**, not just by method. Multipart endpoints need explicit Origin/Referer checks; relying on Content-Type alone is wrong.

---

## 2026-05-18 · Webhook signature verification skipped if header absent

**What went wrong.** Original webhook code: `if (WEBHOOK_SECRET && signature) { verify }`. Drop the header → verification is bypassed, attacker can spoof `payment.paid`. Also the signature format was wrong (bare hex digest vs PayMongo's `t=...,te=...` format).

**Rule.** **Verify-or-reject** for webhook signatures. Never gate verification behind "if the header is present." Read the provider's actual signing scheme; don't assume a bare HMAC.

---

## 2026-05-18 · In-memory rate limiter on serverless

**What went wrong.** `lib/rate-limit.ts` originally used a `Map`. On Vercel each lambda has its own instance + cold starts wipe state, so the brute-force protection was theater.

**Rule.** Any rate limit that crosses requests must use a shared store (Mongo TTL collection, Redis, etc.). In-memory `Map` is dev-only and should be labeled as such if used.
