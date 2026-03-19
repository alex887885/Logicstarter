---
description: Worker-safe implementation plan for Logicstarter Stripe billing on Cloudflare Workers
---

# Logicstarter Stripe x Cloudflare Worker-safe Plan

## Background

Logicstarter has already completed the following prerequisite work:

- centralized `RUNTIME_TARGET` parsing
- Worker-safe runtime env injection for config reads
- removal of eager top-level Stripe imports from `auth.server.ts`
- Stripe server plugin lazy-loading only when `RUNTIME_TARGET=node`
- explicit runtime guard for `/api/auth/stripe/*` on non-node targets
- truthful billing runtime overview reporting that a Worker-safe Stripe server path is still missing

This means the project has already moved from “Cloudflare auth bootstrap is blocked by top-level Stripe dependencies” to “billing is explicitly isolated on Cloudflare, but a usable Worker-safe billing implementation does not yet exist.”

## Confirmed conclusions

### 1. Better Auth core and the Stripe plugin must be evaluated separately

`better-auth-cloudflare` is suitable for adapting Better Auth core to the Cloudflare Workers runtime.

However, the current official Stripe plugin documentation still explicitly assumes:

- `@better-auth/stripe`
- the `stripe` SDK
- `/api/auth/stripe/webhook`

So the current Stripe billing server path in this project cannot be treated as Worker-safe merely because Better Auth core supports Cloudflare.

### 2. The real boundary in the current project

The billing client path can likely remain in place:

- `@better-auth/stripe/client`
- publishable key exposure strategy
- billing runtime/operator visibility

The billing server path remains the blocker:

- checkout session creation
- webhook signature verification and event handling
- the server semantics behind `/api/auth/stripe/*`

## Goal

Add a Stripe billing server path that works on Cloudflare Workers without regressing the current Node baseline.

## Two candidate routes

## Route A: Better Auth plugin-native Cloudflare route

### Assumption

A future or already-supported Better Auth Stripe plugin path can provide equivalent checkout and webhook behavior on Cloudflare Workers.

### Questions that must be verified

- can `@better-auth/stripe` initialize in a Worker runtime?
- does the current `stripe` SDK version satisfy the plugin’s needs in Workers?
- can `/api/auth/stripe/webhook` perform signature verification correctly under the Worker Request/Response model?
- does the plugin rely on Node-only APIs, Buffer behavior, streams, or similar runtime assumptions?

### Benefits

- preserves the Better Auth plugin-native approach
- stays aligned with the existing auth schema and subscription lifecycle model
- likely lower long-term maintenance cost

### Risks

- current public docs do not prove that this path is Worker-ready
- if any layer still assumes Node-only behavior, the effort may still need to fall back to Route B

## Route B: Cloudflare-specific billing server path

### Assumption

Better Auth continues to own auth, sessions, organization logic, and subscription schema cooperation, while Stripe checkout and webhook handling move to a Cloudflare-specific server path.

### Recommended minimum split

- keep Better Auth as the primary auth entry
- split Stripe checkout server behavior out of `/api/auth/stripe/*`
- split Stripe webhook handling into a Cloudflare-specific handler
- use Worker-safe fetch / Stripe HTTP behavior directly inside the Cloudflare route instead of relying on the current Node-only plugin initialization path

### Benefits

- avoids the current plugin server path’s Node-only assumptions
- provides clearer control over Cloudflare runtime behavior

### Risks

- subscription state synchronization back into Better Auth / local schema must be defined carefully
- webhook idempotency, signature verification, and event mapping must be implemented explicitly
- this is more custom than Route A

## Recommended execution order

### Phase 1: continue with a plugin-native feasibility spike

Goal: prefer the Better Auth native route if possible.

Required work:

- build a Cloudflare auth factory spike
- verify whether the Stripe plugin can initialize without the current Node-only lazy-loading path
- verify whether the webhook route can execute under Worker semantics

Exit criteria:

- if feasible, proceed with Route A
- if not feasible, switch immediately to Route B

### Phase 2: preserve the current safe isolation

Until a real Worker-safe implementation exists, keep the following behavior:

- `/api/auth/stripe/*` returns a structured `503` on non-node runtimes
- the billing runtime overview explicitly reports the missing Worker-safe server path
- the settings surface continues warning operators not to use the current webhook/checkout path on Cloudflare

### Phase 3A: if Route A is feasible

Required work:

- add `createCloudflareLogicstarterAuth()`
- wire `better-auth-cloudflare` into Cloudflare auth bootstrap
- attach the Stripe plugin to the Cloudflare auth factory
- add Cloudflare-target checkout / webhook contracts
- extend smoke / acceptance coverage

### Phase 3B: if Route B is more realistic

Required work:

- design a dedicated Cloudflare checkout route
- design a dedicated Cloudflare webhook route
- define event mapping back into local subscription state
- define webhook idempotency storage
- keep Node target on the current Better Auth Stripe plugin path

## Minimum viable Worker-safe billing definition

The first Worker-safe billing milestone is reached when all of the following are true:

- `RUNTIME_TARGET=cloudflare` no longer depends on Node Stripe plugin initialization during auth bootstrap
- Cloudflare has a callable checkout server path
- Cloudflare has a callable webhook verification and event handling path
- the operator runtime API can show billing is no longer `worker_unsupported`
- at least one Cloudflare billing contract proves the server path cannot silently fall back to the current Node-only route

## Acceptance criteria

### Code level

- no top-level Node-only Stripe server dependency can enter the Cloudflare execution path
- Node and Cloudflare billing server responsibilities are explicit
- switching runtime targets must not break auth bootstrap

### Runtime level

- Node target keeps the existing baseline green
- on Cloudflare, `/api/auth/stripe/*` is either formally replaced or guarded while a new Worker-safe route exists
- the billing runtime overview reports the active server path mode truthfully

### Regression level

- `pnpm typecheck` passes
- `pnpm build` passes
- `pnpm smoke:baseline` remains green
- at least one new Cloudflare billing contract is added

## Recommended next action

The best next move is:

1. build a `createCloudflareLogicstarterAuth()` spike
2. use a minimal experiment to verify whether the Stripe plugin can initialize under the Worker model
3. if that fails, switch immediately to a Cloudflare-specific checkout/webhook route instead of spending too long forcing the plugin path
