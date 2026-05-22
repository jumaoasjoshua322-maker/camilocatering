# Current Task

_No active task. Next time you start non-trivial work, replace this section with the plan._

---

## Recently completed

### Test suite — small, deliberate, security-focused
- Installed `vitest@2.1.9` as a devDep. Exact pin per CLAUDE.md.
- `vitest.config.ts` with the `@/` alias so tests resolve like the app, environment `node`, scope limited to `tests/**/*.test.ts`.
- Three suites, 32 tests total, sub-second runtime:
  - `tests/services/storage.test.ts` (10 tests) — magic-byte sniffing for JPEG/PNG/GIF/WebP, rejection of HTML/SVG/random bytes, length guard
  - `tests/lib/validations.test.ts` (13 tests) — bookingSchema (past dates, invalid ObjectIds, negative guests), contactMessageSchema (length, email shape), registerSchema password rules, packageSchema cross-field min/max + javascript: URL rejection
  - `tests/lib/security.test.ts` (9 tests) — `isSameOrigin` accepts matching origin, rejects cross-origin and missing-headers, falls back to Referer, honors `APP_ALLOWED_ORIGINS`
- Exported `detectImageMime` from `services/storage.ts` so tests can target it directly. Comment explains why.
- `tests/README.md` documents the philosophy: pure functions only, no DB or React, integration tests would live in a separate runner.
- README updated with a Development → Tests section and a status row crediting the 32 tests.

### Verification
- `npm test` → 3 files, 32 passed, 653ms
- `getDiagnostics`: clean across all touched files
- `npm run build`: ✓ Compiled successfully in 13s

### Files touched
- `package.json` — vitest dep + test scripts
- `vitest.config.ts` (new)
- `services/storage.ts` — exported `detectImageMime`
- `tests/README.md` (new)
- `tests/services/storage.test.ts` (new)
- `tests/lib/validations.test.ts` (new)
- `tests/lib/security.test.ts` (new)
- `README.md` — Development section + status row
