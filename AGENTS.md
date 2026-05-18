# Repo-specific notes for autonomous agents

## Next.js compatibility

This project uses Next.js as declared in `package.json`. APIs, conventions,
and file structure may differ from older versions. Confirm major version
in `package.json` before writing framework code, and read the source file
you're editing for current import shape. Do not rely on training-data
memory of older Next versions.

## Database

Mongo URI may not include a database name. Always confirm the target
database (`db.admin().listDatabases()`) before any data-mutating script.
The seed script (`scripts/seed.mjs`) refuses to run when
`NODE_ENV=production` unless `ALLOW_PRODUCTION_SEED=1`.

## Payments

`/api/payments/create` is gated behind `ENABLE_LOCAL_PAYMENT=1` and
returns 503 otherwise. Never enable it in production. Real PayMongo
integration is the work item that replaces this stub.

## Uploads

`public/uploads/` survives only during dev. On Vercel-style deploys,
swap `services/storage.ts` to a remote provider. The route accepts
admin-only multipart and validates by magic byte, not MIME header.
