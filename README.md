# Logicstarter

Build your next SaaS product on a starter that already ships authentication, billing, storage, provider runtime management, and operator-facing observability.

[Website](https://starter.logicm8.com)

[Documentation](https://starter.logicm8.com/docs)

## Why Logicstarter

Logicstarter is the current starter baseline for future product lines.

It is designed for teams that want to launch faster without rebuilding the same infrastructure every time:

- Better Auth already wired into the runtime
- Provider configuration for auth, billing, email, SMS, and storage
- Stripe billing flows with checkout, portal, webhook, state, and repair paths
- Storage abstraction for local, S3, and R2
- Runtime visibility for operators
- Real smoke validation paths for auth, storage, and billing

## What you get

- **Authentication**
  - Better Auth
  - email/password
  - social providers
  - organization-ready auth surfaces

- **Billing**
  - Stripe checkout
  - customer portal
  - webhook handling
  - billing state sync and repair

- **Provider runtime**
  - env-oriented configuration workflow
  - provider settings console
  - runtime snapshots for troubleshooting
  - validation before rollout

- **Storage and delivery**
  - local storage
  - S3 / R2 support
  - email provider abstraction
  - SMS provider abstraction

## Product links

- **Live starter**
  - `https://starter.logicm8.com`

- **Docs**
  - `https://starter.logicm8.com/docs`

- **Provider console**
  - `https://starter.logicm8.com/settings/providers`

## Runtime model

Logicstarter supports two main deployment styles:

- **Node runtime**
  - uses `.env` and optional `.env.runtime`

- **Cloudflare-style runtime**
  - uses bindings and deployment secrets as the source of truth

For future product lines, runtime env and deployment secrets should remain the canonical configuration layer.

## Important routes

- `/settings/providers`
- `/api/providers/runtime`
- `/api/auth/runtime`
- `/api/billing/runtime`
- `/api/billing/checkout`
- `/api/billing/portal`
- `/api/billing/webhook`
- `/api/billing/state`
- `/api/billing/sync`
- `/api/storage/runtime`

## Quick start

### Local development

1. Copy `.env.example` to `.env`.
2. Copy `.env.runtime.example` to `.env.runtime` if you want runtime overrides.
3. Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_ORIGIN`, and `SETTINGS_SECRET_KEY`.
4. Configure the providers you need.
5. Start the app with your normal package workflow.

### Docker quick start

1. Copy `.env.docker.example` to `.env.docker.app`.
2. Copy `.env.docker.db.example` to `.env.docker.db`.
3. Copy `.env.docker.runtime.example` to `.env.docker.runtime`.
4. Set `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `DATABASE_URL` in the Docker env files.
5. Set `LOGICSTARTER_DOCKER_POSTGRES_PORT` if host port `55432` is not suitable.
6. Run `docker compose up --build`.
7. Run `docker compose exec app pnpm db:migrate`.

For the full bootstrap flow, read `docs/docker-install.md`.

## Validation commands

- `pnpm typecheck`
- `pnpm build`
- `pnpm smoke:baseline`
- `pnpm smoke:auth-real`
- `pnpm smoke:storage-real`
- `pnpm smoke:billing-real`

## Billing validation notes

Billing validation depends on these being correct:

- Stripe runtime keys are configured
- `/api/billing/runtime` reports healthy readiness
- the Stripe test account contains at least one active recurring price

Before treating billing as blocked by application logic, also confirm:

- the smoke user exists and is verified
- `LOGICSTARTER_TEST_EMAIL` is set
- `LOGICSTARTER_TEST_PASSWORD` is set
- `LOGICSTARTER_STRIPE_TEST_PRICE_ID` points to an active recurring Stripe test price

If webhooks are delayed or missed, use the authenticated `POST /api/billing/sync` endpoint to repair local billing state.

## Docs map

Use these documents as the operating baseline for new projects and upgrade work:

- `docs/docker-install.md`
- `docs/better-auth-current-version-comparison.md`
- `docs/ai-windsurf-operations.md`
- `docs/migration-from-starter.md`
- `docs/release-candidate-checklist.md`
- `docs/github-transition-handoff.md`
- `docs/plans/logicstarter-github-transition-plan.md`

## Migration guidance

If you are moving an older starter deployment onto this line, follow `docs/migration-from-starter.md`.
