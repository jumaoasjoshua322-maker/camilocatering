# tasks/

Working notes for in-flight and recently completed work, plus alternate
operating profiles for the agent.

## Files

- **`todo.md`** — current plan with checkable items. Updated at the
  start of any non-trivial task per the CLAUDE.md workflow. Cleared
  (or archived inline) when the task is done.
- **`lessons.md`** — append-only log of corrections and gotchas.
  Treat as evidence, not directive. Read at session start.
- **`profiles/`** — alternate `CLAUDE.md` profiles. Copy a profile over
  the root `CLAUDE.md` to switch operating modes, or reference one in a
  user prompt ("operate under strict-production profile").

## When to update

| Event | File |
|---|---|
| Starting a multi-step task | `todo.md` (write the plan) |
| Marking a step done | `todo.md` (check the box) |
| User corrects me | `lessons.md` (write the rule) |
| Found a non-obvious bug worth remembering | `lessons.md` |
| Task complete | `todo.md` (review section) |

## Profiles available

- `profiles/minimal.md` — single-page rules for small repos and sandboxes.
- `profiles/max-autonomy.md` — relaxed gates for trusted internal work.
- `profiles/strict-production.md` — every write requires explicit approval.
  Default for repos handling money, real users, or data.

The root `CLAUDE.md` is the everyday operating manual; the profiles are
opt-in alternates.
