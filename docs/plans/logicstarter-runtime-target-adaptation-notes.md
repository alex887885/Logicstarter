---
description: Runtime target adaptation notes for Logicstarter across Node, Cloudflare Workers, and Vercel with better-auth-cloudflare integration points
---

# Logicstarter Runtime Target Adaptation Notes

## Current state

Logicstarter is currently a Node-first runtime.

Implemented behavior:
- `RUNTIME_TARGET=node|cloudflare|vercel` is parsed centrally.
- provider settings export writes to `.env.runtime`.
- local runtime env export is only allowed when `RUNTIME_TARGET=node`.
- non-node runtime targets return a structured export error instead of attempting filesystem writes.
- Better Auth canonical origin resolution now supports `AUTH_CANONICAL_ORIGIN`.
- auth secret file fallback is only enabled when `RUNTIME_TARGET=node`.
- Better Auth auth initialization no longer eagerly imports Stripe at the module top level and now lazy-loads the Stripe server plugin only when `RUNTIME_TARGET=node`.
- `/api/auth/stripe/*` now returns a structured `503` runtime guard on non-node targets instead of falling through the current Node-only billing server path.

## Stripe x Cloudflare current conclusion

### 1. Better Auth core and the Stripe plugin must be evaluated separately
- Better Auth core can be adapted to Cloudflare Workers with `better-auth-cloudflare`.
- The current official Stripe plugin documentation still assumes:
  - `@better-auth/stripe`
  - the `stripe` SDK
  - `/api/auth/stripe/webhook`
- In practice, the current Stripe billing server path in this project cannot yet be treated as Worker-safe just because `better-auth-cloudflare` exists.

### 2. Minimum safe isolation already completed
- `auth.server.ts` now resolves the Stripe server plugin dynamically by runtime target.
- a Cloudflare contract now guards against reintroducing top-level Stripe imports into auth bootstrap.
- `api.auth.$.tsx` now explicitly guards `/api/auth/stripe/*` on non-node runtimes.
- the billing runtime snapshot/status now reports the node-only server path truthfully.

### 3. Core capability still missing
- a truly Worker-safe checkout server path for Stripe
- a truly Worker-safe webhook verification and event handling path for Stripe
- a Cloudflare-specific billing implementation strategy that can cooperate with the Better Auth auth factory

## Current Node-only assumptions

### 1. Auth secret fallback
`app/lib/auth.server.ts`
- falls back to `/app/.env` only for `node`
- must eventually be replaced by a runtime secret source abstraction

### 2. Runtime env export
`app/lib/logicstarter/env-sync.server.ts`
- writes `.env.runtime`
- intentionally blocked for `cloudflare` and `vercel`

### 3. Operational helper script
`scripts/export-provider-env.mjs`
- still assumes a writable filesystem
- suitable for Node containers only

### 4. Stripe billing server path
`app/lib/auth.server.ts` + `app/routes/api.auth.$.tsx`
- the Stripe plugin is currently activated only on the `node` target
- Cloudflare and Vercel are now explicitly isolated, but this is still not a Worker-safe billing implementation

## Good reusable layers already present

### 1. Provider settings resolution
`app/lib/logicstarter/provider-settings.server.ts`
- already separates env values from DB-backed values
- this is a good base for platform-specific secret/config sources

### 2. Messaging abstraction
`app/lib/logicstarter/messaging.server.ts`
- keeps provider selection separate from auth events
- Better Platform, Resend, SES, Vonage, Amazon SNS are transport choices
- this can survive runtime migration if transport adapters are split by platform

### 3. Runtime target parsing
`app/lib/logicstarter/config.server.ts`
- already centralizes `RUNTIME_TARGET`
- should become the switch for future runtime service resolution

## better-auth-cloudflare integration points

The package is already present in `package.json`.

Recommended usage model:
- keep the current Node Better Auth path as the reference baseline
- introduce a Cloudflare-specific auth factory instead of mutating the existing Node path until both runtimes are mixed together
- use `better-auth-cloudflare` as the Worker-specific adapter/reference for request/runtime differences
- do not treat `better-auth-cloudflare` itself as proof that the Stripe plugin server path is already Worker-safe; billing still needs separate verification or a separate implementation

## Recommended architecture split

### 1. Runtime services layer
Create a runtime service resolver that returns:
- secret source
- provider config source
- env export target
- storage capability flags
- runtime-specific messaging transport factories

### 2. Auth factory split
Refactor auth setup into:
- `createNodeLogicstarterAuth()`
- `createCloudflareLogicstarterAuth()`
- optional `createVercelLogicstarterAuth()` if Vercel diverges enough from Node

### 3. Secret/config source abstraction
Replace direct reads with interfaces such as:
- `readSecret(key)`
- `readRuntimeConfig(key)`
- `writeRuntimeConfigSnapshot(values)`

Node implementation:
- process env
- optional `.env` fallback
- `.env.runtime` export

Cloudflare implementation:
- bindings / dashboard env
- no local file writes

Vercel implementation:
- deployment env vars
- no local file writes

## Migration order

### Phase A
Keep Node authoritative and remove hidden filesystem assumptions from shared modules.

### Phase B
Extract runtime services and isolate provider export behavior behind `RUNTIME_TARGET`.

### Phase C
Add a Cloudflare-specific auth/bootstrap path using `better-auth-cloudflare`.

### Phase D
Add Cloudflare billing isolation, platform-specific deployment docs, and acceptance checks.

### Phase E
Implement a truly Worker-safe Stripe checkout/webhook server path, or switch back to a Better Auth plugin-native Cloudflare route once official support is confirmed.

## Acceptance targets per runtime

### Node
- `pnpm smoke:baseline` passes
- settings export writes `.env.runtime`
- Better Auth social initiation and unauthenticated session checks pass

### Cloudflare
- auth bootstrap does not import Node filesystem APIs in execution paths
- provider export returns a structured platform message instead of attempting local file writes
- canonical auth origin and Better Auth callbacks resolve from runtime config/bindings
- `/api/auth/stripe/*` does not accidentally fall through the current Node-only billing server path
- the billing runtime overview explicitly shows that a Worker-safe Stripe implementation is still missing

### Vercel
- auth bootstrap avoids local writable env assumptions
- provider export returns a structured platform message
- Better Auth callback and canonical origin remain stable behind reverse proxy headers

## Immediate next code targets

1. extract runtime service helpers from `auth.server.ts` and `env-sync.server.ts`
2. isolate Node-specific filesystem fallback into a dedicated module
3. prepare a Cloudflare auth factory spike using `better-auth-cloudflare`
4. add platform-aware smoke notes for `node`, `cloudflare`, and `vercel`
5. design the boundary for a Worker-safe Cloudflare-specific Stripe checkout/webhook implementation
