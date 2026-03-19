# Migrating from the Original Starter to Logicstarter

This guide describes how to move an existing legacy starter deployment to the new Better Auth-based starter line with minimal surprises.

## What changes in Logicstarter

Compared with the legacy starter project, this codebase adds:

- A Cloudflare-first configuration strategy
- A runtime-aware provider settings experience
- Worker-safe Stripe billing routes
- Billing state synchronization and repair
- Expanded runtime snapshots for operators
- Storage runtime abstraction across local, S3, and R2

## 1. Freeze the old deployment

Before migration:

- Stop making config changes in the legacy starter deployment.
- Export the current environment variables.
- Record the active auth providers, billing settings, storage settings, and mail settings.
- Record webhook endpoints and callback origins.

## 2. Map the environment

Translate the legacy starter config into the new starter runtime model.

### Core app settings

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `APP_ORIGIN`
- `SETTINGS_SECRET_KEY`
- `RUNTIME_TARGET`

### Auth settings

- `AUTH_GOOGLE_ENABLED`
- `AUTH_GOOGLE_CLIENT_ID`
- `AUTH_GOOGLE_CLIENT_SECRET`
- `AUTH_GITHUB_ENABLED`
- `AUTH_GITHUB_CLIENT_ID`
- `AUTH_GITHUB_CLIENT_SECRET`

### Billing settings

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Storage settings

Choose one runtime storage model:

- Local
- S3
- R2

Then provide the matching keys in `.env.runtime` or your deployment secrets.

## 3. Choose your runtime source of truth

### Node deployment

Use:

- `.env` for install-time base configuration
- `.env.runtime` for mutable runtime overrides

### Cloudflare deployment

Use:

- Deployment bindings
- Deployment secrets

Do not treat `.env.runtime` as the authoritative production source on Cloudflare.

## 4. Reconfigure webhooks and callback origins

Review and update:

- Better Auth callback origins
- Stripe webhook target URL
- Storage public URL
- Any mail or SMS callback URLs

## 5. Validate provider runtime views

After the new deployment is up:

- Open `/settings/providers`
- Review `/api/providers/runtime`
- Review `/api/auth/runtime`
- Review `/api/billing/runtime`
- Review `/api/storage/runtime`

The operator UI should match the actual deployment model and readiness state.

## 6. Run smoke validation

Run the following in order:

- `pnpm typecheck`
- `pnpm build`
- `pnpm smoke:baseline`
- `pnpm smoke:auth-real`
- `pnpm smoke:storage-real`
- `pnpm smoke:billing-real`

For billing validation, ensure the Stripe test account contains at least one active recurring price.

## 7. Cut over

Switch traffic only after:

- Auth is validated
- Storage is validated
- Billing checkout and webhook handling are validated
- Operator runtime views are accurate
- Secrets are cleaned from the repository and deployment notes

At this stage, Logicstarter should already be treated as the effective starter baseline for implementation and validation work.

Repository replacement, archive, rename, and upstream promotion steps are still separate final GitHub actions and should be executed against the legacy public starter identity while being reviewed against `docs/github-transition-handoff.md`.

## 8. Post-cutover operations

Recommended operator checks after cutover:

- Verify new sign-ins and session reads
- Verify billing checkout and state synchronization
- Verify webhook delivery
- Verify storage upload and delete behavior
- Verify mail and SMS provider health

If Stripe state drifts because of delayed or missed webhook delivery, trigger the authenticated billing sync route to repair local state.
