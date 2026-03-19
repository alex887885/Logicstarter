---
description: Logicstarter runtime hardening plan for auth validation, canonical auth origin, dual env layering, and runtime target abstraction
---

# Logicstarter Runtime Bootstrap And Env Layering

## Goals

1. Keep Logicstarter as a Better Auth-first starter on Node today.
2. Prevent auth regressions by codifying the standard Better Auth login chain as an acceptance baseline.
3. Split installation-time secrets from runtime provider configuration.
4. Prepare a clean migration path for Cloudflare Workers and Vercel without destabilizing the Node runtime.

## Phase 1: Better Auth baseline acceptance

### Outcome
A repeatable validation checklist or smoke script verifies the full standard login chain.

### Required checks
- OAuth social sign-in initiation returns a redirect URL.
- OAuth state and PKCE cookies are issued correctly.
- OAuth callback completes and issues a session cookie.
- Root loader and `/api/auth/get-session` return the same authenticated user.
- Database records are present for `user`, `account`, and `session`.
- Sign-out invalidates the active session.
- Email verification and reset-password flows still use Better Auth event hooks.

### Deliverables
- Validation checklist in docs.
- Optional smoke script for container/runtime validation.
- Removal of temporary auth debug logs after the baseline is stable.

## Phase 2: Canonical auth origin

### Outcome
A single canonical auth origin drives OAuth callbacks, email links, and invitation links.

### Proposed config
- `AUTH_CANONICAL_ORIGIN`
- `APP_ORIGIN`
- `BETTER_AUTH_URL`
- request-derived origin only as a fallback for trusted proxy scenarios

### Rules
- Use canonical origin for email links and invitation links.
- Use canonical origin as the preferred Better Auth base URL.
- Keep trusted origins explicit and additive.
- Do not hardcode localhost in production fallbacks.

## Phase 3: Dual env layering

### Outcome
A fresh install can start with only core bootstrap settings, while provider settings can be added later through the settings UI and exported into a runtime env file.

### Files
- `.env.install.example`
- `.env.runtime.example`

### Install env
Use only bootstrap requirements:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `APP_ORIGIN`
- `RUNTIME_TARGET`
- `PORT` if needed

### Runtime env
Use provider and integration settings:
- email provider keys
- sms provider keys
- social auth provider keys
- billing keys
- future storage/provider keys

### Rules
- Logicstarter boots with install env only.
- Settings UI persists provider values to the database.
- Export/sync writes runtime provider values into `.env.runtime`.
- `RUNTIME_TARGET=node` is currently required for local runtime env export.
- `RUNTIME_TARGET=cloudflare` and `RUNTIME_TARGET=vercel` should return a structured export error and rely on platform-managed secrets instead of local writable env files.

## Phase 4: Runtime target abstraction

### Outcome
Logicstarter explicitly declares the runtime target and adjusts platform-specific behavior.

### Proposed values
- `RUNTIME_TARGET=node`
- `RUNTIME_TARGET=cloudflare`
- `RUNTIME_TARGET=vercel`

### Expected behavior
- `node`: allow filesystem env sync to `.env.runtime` and keep current server behavior.
- `cloudflare`: disable local file sync, prefer platform secrets/bindings, and adapt Better Auth runtime APIs.
- `vercel`: avoid writable local env assumptions and prefer deployment environment variables.

## Cloudflare direction

### Short-term
- Treat Node as the authoritative runtime.
- Continue using the current provider settings and messaging abstraction.
- Review `better-auth-cloudflare` as a reference or future adapter target.

### Mid-term
- Extract runtime-dependent services behind interfaces:
  - secret source
  - provider config source
  - env export target
  - email transport
  - sms transport
- Remove direct Node filesystem assumptions from shared auth/provider code.

### Long-term
- Add a Cloudflare-specific runtime package or adapter layer.
- Support secrets and provider config through Cloudflare bindings, KV, D1, or dashboard-managed variables.

## Immediate implementation order

1. Add `RUNTIME_TARGET` to bootstrap env handling.
2. Add install/runtime env examples.
3. Add auth baseline validation checklist and scripts.
4. Add canonical auth origin config and wire invitation/email link generation to it.
5. Remove temporary auth debug logging once the baseline is locked.
