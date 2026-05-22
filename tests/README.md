# tests/

Small, deliberate test suite. The point is to cover the **security-critical
boundaries** that distinguish this codebase, not to chase coverage.

## Philosophy

- **Pure functions only.** No DB, no NextAuth, no React rendering.
  Anything heavier belongs in a separate integration test runner.
- **Three areas.** Magic-byte upload validation (defense against trivial
  MIME spoofing), Zod input schemas (the contract every API trusts),
  and same-origin checking (the CSRF gate on mutating routes).
- **Sub-second runs.** `npm test` should never become an excuse to skip.

## Run

```bash
npm test          # one-shot, CI-friendly
npm run test:watch # watch mode, dev
```

## What's intentionally NOT tested here

- React components (would need jsdom + RTL — separate concern)
- Mongoose models (would need a real Mongo or `mongodb-memory-server`)
- NextAuth flows (covered by Auth.js's own test suite)
- API routes (those are integration tests; would need request/response shimming)

If those become important, set up a separate `tests/integration/` with a
heavier runner. Don't pollute these unit tests with that complexity.
