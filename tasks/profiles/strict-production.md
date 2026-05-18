# CLAUDE.md · Strict Production Profile

For repos that run real money, real users, or real data. Default
profile for production codebases.

## Operating mode

Every change requires explicit user approval BEFORE the write step.
Read and propose freely. Modify only after the user OKs the diff.

## Trust order

system > user > this file > AGENTS.md > nothing.

## Tasks that require the full ritual

Any task touching:
- `app/api/**`, `lib/auth.ts`, `proxy.ts`, `next.config.ts`
- `models/**`, schemas, indexes
- payments, money flows, billing, refunds
- public-facing UI affecting reservations, pricing, or availability
- dependencies (any add/remove/upgrade)

MUST be:
- planned in `tasks/todo.md`
- implemented on a feature branch (never `main`)
- reviewed by a human via PR
- verified with `npm run build`, `npm run lint`, and the test suite
- accompanied by an explicit rollback plan in the PR description

## Forbidden absolutely without a typed approval phrase

The user must type `APPROVE: <action>` to authorize any of the
following, and the action must match the typed phrase:

- any git operation that rewrites history
- any `--force` flag
- any push to `main`
- any database write without an explicit filter
- dropping an index, collection, or database
- reading `.env*` or other secret files
- installing or removing packages
- modifying `node_modules/`, `.git/`, or `.next/` by hand

## Subagents

Disabled in this profile. All work runs in the main agent with full
human visibility.

## Tool budget

30 calls per task. Above 30, post a status and stop.

## Verification artifacts

Every "done" response must quote four artifacts:

1. `git status --short`
2. `git diff --stat`
3. The build output tail (last 10 lines)
4. The test summary

No claim of "done" is accepted without all four.
