# AI and Windsurf Operations Guide

Use this document when working in this workspace through AI or Windsurf.

The goal is to make future execution safer, faster, and more repeatable.

## 1. Operating scope

Treat the current active workspace model as:

- `Logicstarter` = current effective starter baseline and Better Auth reference line
- `newsign` = current product-side active line
- `logicsign` = older active project line still relevant for compatibility comparison

Do not use the deprecated original starter line as the Better Auth comparison baseline for upgrade planning.

## 2. Core rule for Better Auth work

Do not modify Better Auth internals.

When Better Auth behavior differs across projects, only change the project integration layer:

- auth config wrappers
- route wrappers
- env readers
- provider mapping
- client wrappers
- project-side lifecycle hooks

If a local abstraction conflicts with Better Auth, Better Auth takes precedence.

## 3. Default workflow for any auth-related task

### Step 1: classify the task

Decide whether the request is:

- comparison only
- documentation only
- integration-layer refactor
- runtime validation
- production-like smoke validation

Do not run runtime validation unless it is actually needed.

### Step 2: map the auth surface first

Before changing anything, inspect at least:

- `package.json`
- `app/lib/auth.server.ts`
- `app/lib/auth.client.ts` or `app/lib/auth-client.ts`
- `app/routes/api.auth.$.ts`
- any provider settings or auth login visibility helpers

### Step 3: locate drift before proposing fixes

For Better Auth tasks, always compare:

- plugin usage
- secret handling
- `baseURL` resolution
- `trustedOrigins` construction
- email verification behavior
- provider source of truth
- route handler wrappers
- client helper exports

### Step 4: only then edit code or docs

Do not jump directly into edits before the drift map is clear.

## 4. Files that are authoritative for Better Auth compatibility

### Logicstarter

- `Logicstarter/package.json`
- `Logicstarter/app/lib/auth.server.ts`
- `Logicstarter/app/lib/auth-client.ts`
- `Logicstarter/app/lib/logicstarter/config.server.ts`

### newsign

- `newsign/package.json`
- `newsign/app/lib/auth.server.ts`
- `newsign/app/lib/auth.client.ts`
- `newsign/app/routes/api.auth.$.ts`

### logicsign

- `logicsign/package.json`
- `logicsign/app/lib/auth.server.ts`
- `logicsign/app/lib/auth.client.ts`
- `logicsign/app/routes/api.auth.$.ts`
- `logicsign/app/providers/auth/login-methods.server.ts`

## 5. Recommended investigation order

For auth or upgrade issues, investigate in this order:

1. dependency versions
2. server auth bootstrap
3. auth client bootstrap
4. auth route wrappers
5. env/provider settings source
6. runtime warnings or logs
7. interactive validation

This order prevents shallow fixes.

## 6. Safe execution rules

### Read before write

When a task touches unfamiliar code, search and read first.
Do not patch blind.

### Prefer documentation before invasive refactors

If the request is mainly comparison, upgrade readiness, or future maintenance, create or update docs first.

### Keep provider settings env-first for new product lines

For future reusable product lines, treat runtime env and deployment secrets as the source of truth for auth and provider configuration.
Use `/settings/providers` as an env-only workspace, not as a DB-backed canonical config store.

Do not reintroduce DB-backed auth or provider settings unless the product explicitly needs operator-managed dynamic overrides.
If that exception is approved, document the override boundary, precedence rules, and rollback path before implementation.

### Keep changes local to the line being worked on

Do not spread changes across unrelated project lines unless the task explicitly requires it.

### Keep style consistent

Use the existing project naming, route structure, and documentation tone.

## 7. Runtime validation rules

### For Logicstarter

Use runtime and smoke validation when required:

- `pnpm typecheck`
- `pnpm build`
- `pnpm smoke:baseline`
- `pnpm smoke:auth-real`
- `pnpm smoke:storage-real`
- `pnpm smoke:billing-real`

Before claiming billing is healthy, verify:

- Stripe runtime keys are configured
- `/api/billing/runtime` is healthy
- the Stripe test account contains an active recurring price

### For current auth debugging

If investigating auth behavior, check:

- `/api/auth/*` handler behavior
- sign-in and sign-out routes
- Better Auth warnings in container logs
- origin and proxy assumptions
- cookie security assumptions

Do not assume a build succeeded means auth behavior is correct.

## 8. What to do before a Better Auth upgrade

### Required pre-upgrade checklist

- compare the three active projects
- confirm the current `better-auth` version in each project
- list plugin usage per project
- list route wrapper differences
- list client wrapper differences
- list secret and origin handling differences
- identify any hardcoded local origins
- identify any debug-only fallback secrets
- identify any verification lifecycle differences

### Required output

Before upgrading, create or update a written diff document.
Do not rely on memory or chat history alone.

## 9. What to do after a Better Auth upgrade

### Minimum verification

- build each touched project
- hit auth route entrypoints
- test sign-in behavior
- test sign-out behavior
- test session fetch behavior
- test at least one enabled social provider if applicable

### If warnings appear

Warnings about rate limiting, proxy trust, client IP, or cookies should be documented immediately.
These warnings often indicate the next upgrade problem.

## 10. Logicstarter billing real smoke notes

The following billing smoke posture has already been verified for Logicstarter and should be reused in future task planning:

- real billing smoke depends on a verified test account
- real billing smoke depends on a valid recurring Stripe test price
- when the Stripe test account has no active recurring price, smoke execution will fail until one is created or selected
- the smoke script consumes:
  - `LOGICSTARTER_TEST_EMAIL`
  - `LOGICSTARTER_TEST_PASSWORD`
  - `LOGICSTARTER_STRIPE_TEST_PRICE_ID`

Do not report billing smoke as blocked by application logic until those prerequisites are confirmed.

## 11. Documentation outputs that should exist for future reuse

For this workspace, keep these documents current:

- `README.md`
- `docs/release-candidate-checklist.md`
- `docs/new-project-bootstrap-checklist.md`
- `docs/better-auth-current-version-comparison.md`
- `docs/ai-windsurf-operations.md`

## 12. Practical operating summary

When future AI work starts in this workspace:

- treat `Logicstarter` as the Better Auth reference line
- compare only active project lines for upgrade safety
- do not patch Better Auth internals
- diagnose integration drift first
- document findings before major upgrade work
- validate runtime behavior only when needed
