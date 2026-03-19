---
description: Logicstarter mainline runtime and operator readiness plan
---

# Logicstarter Mainline Runtime Plan

## Goal

Bring Logicstarter core modules onto one consistent operator-grade runtime model:

- authentication
- email
- sms
- billing
- storage

Each module should expose:

- a runtime API
- an operator-visible readiness surface
- a baseline smoke/contract check

## Completed

### Storage

- Added multi-provider storage runtime support for local, S3, and R2
- Added storage runtime visibility in operator settings
- Added provider-aware storage smoke coverage
- Added remote-storage smoke path for signed PUT capable providers

### Billing

- Wired Stripe runtime reads through Logicstarter config
- Added `GET /api/billing/runtime`
- Added billing runtime status card in provider settings
- Added billing baseline contract coverage

### Email and SMS

- Added `GET /api/email/runtime`
- Added `GET /api/sms/runtime`
- Added email and SMS runtime status cards in provider settings
- Added baseline contract coverage for both runtime APIs

### Authentication

- Added `GET /api/auth/runtime`
- Added authentication runtime status card in provider settings
- Added baseline contract coverage for auth runtime readiness

### Runtime overview

- Added `GET /api/providers/runtime`
- Added live provider runtime overview card on the settings page
- Added baseline contract coverage for runtime overview summary counts

### Runtime/config unification

- Unified Better Auth secret and origin reads through shared Logicstarter env access
- Added shared provider runtime snapshot helpers for auth, email, sms, and billing
- Reduced duplicated runtime readiness logic across per-module APIs and overview APIs

## Current status

Logicstarter now has a consistent runtime-visibility layer across the mainline modules.

Current validation gate:

- `pnpm typecheck`
- `pnpm build`
- `pnpm smoke:baseline`

## Next recommended work

### 1. Billing productization

- Expand Stripe operator guidance from config readiness into practical checkout/webhook verification steps
- Add authenticated billing smoke coverage once a safe test Stripe config is available

### 2. Runtime abstraction hardening

- Continue moving repeated runtime-readiness logic into shared helpers
- Define a stable internal shape for module runtime snapshots
- Prepare the runtime snapshot model for Node and Cloudflare divergence where needed

### 3. Operator UX polish

- Add cross-module attention states and quick links for incomplete modules
- Surface the highest-priority remediation message per module
- Keep all operator-facing copy in English and style-consistent

### 4. Deployment validation

- Prefer domain-level acceptance checks when the deployment surface is stable
- Keep local container checks as the fast regression gate

## Guardrails

- Prefer Better Auth native/plugin paths over custom abstractions when overlap exists
- Keep runtime status and operator surfaces aligned with actual active config, not only form values
- Keep implementation Cloudflare-first where possible without breaking Node compatibility
