---
description: Logicstarter Stripe Worker-safe MVP rollout
---

# Logicstarter Stripe Worker-safe MVP

## Goal

Ship the minimum Cloudflare-compatible Stripe billing path without breaking the existing Node Better Auth Stripe plugin flow.

## Scope

### Keep
- Existing Node Better Auth Stripe plugin path
- Existing Node auth route guard behavior
- Existing provider settings surface for Stripe keys

### Add
- Worker-safe checkout session API
- Worker-safe webhook API
- Billing runtime snapshot/status that can report Worker-safe readiness separately from the Node plugin path
- Settings page billing references that point to the active Worker-safe webhook endpoint

## Constraints

- Do not remove the current Node billing path.
- Prefer Better Auth-native data/contracts where practical, but do not block on the Better Auth Stripe server plugin being Worker-safe.
- Cloudflare runtime should use bindings/secrets as the runtime source of truth.

## MVP Phases

### Phase 1
- Inventory all Stripe entry points and runtime assumptions.
- Confirm current schema can support a minimal Worker-safe path.

### Phase 2
- Add `/api/billing/checkout` for Worker-safe Stripe Checkout session creation.
- Add `/api/billing/webhook` for Worker-safe webhook verification.
- Keep implementation stateless/minimal where possible.

### Phase 3
- Update billing runtime status and operator docs/UI.
- Validate typecheck, build, and smoke baseline.

## Acceptance Criteria

- Node runtime continues to pass baseline smoke.
- Cloudflare-target billing status no longer reports webhook/checkout as inherently node-only once Worker-safe endpoints are present.
- No top-level Stripe server imports are reintroduced into the auth bootstrap path.

## Real Validation

- Run `pnpm smoke:billing-real` after setting `LOGICSTARTER_TEST_EMAIL`, `LOGICSTARTER_TEST_PASSWORD`, and `LOGICSTARTER_STRIPE_TEST_PRICE_ID`.
- Treat `checkout` as the primary live validation path.
- Treat `billing state` as the operator-visible confirmation surface for linked customers and synchronized subscriptions.
- Treat `portal` as conditional: it should return a controlled error before the first linked customer exists, and a Stripe-hosted URL after customer linkage is established.
