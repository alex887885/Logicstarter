---
description: Native Logicstarter architecture plan for a Cloudflare-first, Worker-compatible core with install-time database profiles and storage providers
---

# Logicstarter Native Runtime and Storage Provider Plan

## Positioning

Logicstarter should be treated as a native starter with the following product stance:

- Cloudflare-first
- Worker-compatible by design
- Node-compatible without becoming Node-only
- Vercel handled later as an adaptation target, not as the primary architectural baseline

This means the current version should not be framed as a Node starter with a Cloudflare plugin. It should be framed as a native runtime-neutral starter whose core architecture already fits Cloudflare Workers while still running well on Node.

## Why this direction

The Better Auth core flow is already close to runtime-neutral:

- request/response handling is Web-standard oriented
- sign-in, callback, session reads, and sign-out can remain shared
- Drizzle can remain the shared ORM layer
- Postgres can remain a first-class path for both Node and Worker deployments

The main differences are concentrated in infrastructure wiring, not in business logic:

- database driver selection
- runtime config and secret resolution
- local filesystem availability
- storage backend bindings
- platform-specific export or deployment workflows

Because of this, Logicstarter should aim for a thin runtime abstraction rather than separate platform products.

## Product model

### Core principle

Keep one Logicstarter core and make platform differences explicit only in infrastructure boundaries.

### Native runtime targets

The native targets for this version should be:

- Cloudflare Workers
- Node

The later adaptation target should be:

- Vercel

Vercel should be treated as an additional compatibility layer after the native architecture is stable.

## Install-time setup model

The main install-time decision should be the database profile, not the entire application architecture.

### Supported database profiles

- `pg`
- `d1`

### PG profile

Recommended as the default profile.

Characteristics:

- works well with Better Auth
- works well with Drizzle
- works on Node
- works on Cloudflare Workers through Worker-compatible Postgres paths
- gives the cleanest shared path between Node and Cloudflare

Likely deployment variants:

- Node + Postgres
- Cloudflare Workers + Postgres

### D1 profile

Recommended as the Cloudflare-native option.

Characteristics:

- optimized for Cloudflare-native deployments
- useful when the deployment target is fully Cloudflare-centered
- requires a different Drizzle driver and Better Auth database setup

Likely deployment variant:

- Cloudflare Workers + D1

## Runtime strategy

### Goal

Design Logicstarter so the main application logic does not care whether it runs on Node or Workers.

### Thin runtime boundaries

The runtime boundary should be concentrated in a very small set of interfaces:

- `createDb()`
- `createAuth()`
- `readRuntimeConfig()`
- `readSecret()`
- `exportRuntimeConfigSnapshot()`
- `createStorageProvider()`

Everything above these interfaces should stay inside the shared Logicstarter core.

## Database architecture

### Shared layer

These should stay shared across runtime targets whenever possible:

- domain logic
- Better Auth business options
- Drizzle schema contracts where possible
- session and account lifecycle logic
- settings and provider management UI

### Variable layer

These should be runtime-aware or profile-aware:

- database client initialization
- driver selection
- connection source
- migration workflow

### Initial recommendation

Prioritize `pg` as the main shared path.

A likely model is:

- Node uses a Node-optimized Postgres driver
- Cloudflare Workers uses a Worker-compatible Postgres path
- both still use Drizzle and Better Auth with the same logical auth model

This keeps the cross-platform core simpler than designing around D1 first.

## Auth architecture

### Core stance

Better Auth should remain the single source of truth for:

- email/password
- social login
- session lifecycle
- account persistence
- sign-out invalidation

### Auth factory direction

Move toward a shared auth entry point that accepts runtime-aware dependencies instead of hardcoding a Node-only path.

Recommended direction:

- `createLogicstarterAuth()` as the shared entry
- runtime-aware injection for database and secrets
- keep Better Auth configuration as shared as possible

### What should remain shared

- auth methods configuration
- provider enable/disable logic
- social callback URL handling
- bootstrap admin behavior
- session contract

### What should become runtime-aware

- database adapter source
- secret source
- optional Cloudflare-specific metadata integrations

## Storage provider architecture

Storage should become a first-class provider system inside Logicstarter core.

### Initial storage providers

- `local`
- `s3`
- `r2`

### Why storage must be a provider

Storage affects more than file upload mechanics. It also affects:

- signed upload behavior
- signed download behavior
- public URL generation
- private asset access rules
- metadata persistence
- runtime capability checks
- deployment guidance

### Shared storage contract

Introduce a common storage provider interface that can support:

- put object
- get public URL
- get signed URL
- delete object
- persist metadata
- validate configuration

### Provider expectations

#### Local

Use cases:

- local development
- simple Node deployments

Constraints:

- should be treated as Node-only in practice
- should not be considered a native Worker storage backend

#### S3

Use cases:

- portable object storage backend
- works across Node and Worker with HTTP-compatible approaches

Constraints:

- signing strategy must be runtime-safe
- avoid Node-only assumptions in the core path

#### R2

Use cases:

- Cloudflare-native object storage
- preferred object storage on Cloudflare deployments

Constraints:

- integrate cleanly with Worker bindings
- keep the provider contract aligned with S3-style expectations where practical

## Configuration model

### Provider settings

Provider settings should remain a core Logicstarter capability.

That should include:

- auth providers
- email providers
- sms providers
- storage providers

### Resolution order

The runtime config system should support a consistent precedence model, such as:

- explicit runtime bindings or environment variables
- stored provider settings from the database
- install-time defaults

### Export model

The export concept should remain, but the output should depend on platform capability.

#### Node

- allow `.env.runtime` or equivalent file-based export

#### Cloudflare

- generate deployment-oriented config snapshots
- do not assume local writable filesystem as a required runtime feature

## Node compatibility principle

Cloudflare-first does not mean penalizing Node.

The correct rule is:

- do not force Node onto a weaker generic path
- keep Node on efficient native implementations where it helps
- keep runtime branching out of shared business logic

If runtime branching stays inside initialization and provider factories, Node usage and performance should remain effectively intact.

## What should change in the current codebase

### First group: immediate abstraction targets

- `app/db/index.server.ts`
- `app/lib/auth.server.ts`
- `app/lib/logicstarter/config.server.ts`
- `app/lib/logicstarter/env-sync.server.ts`
- provider settings export flow

### Second group: new provider-oriented surfaces

- storage provider settings schema
- storage provider runtime factory
- storage metadata persistence model
- storage settings UI

### Third group: deployment-aware tooling

- install profile selection
- database profile bootstrap
- runtime-aware export or deployment snapshot tooling

## Recommended execution order

### Phase 1: lock the architecture

Define and document:

- native product positioning
- runtime boundaries
- database profiles
- storage provider system

### Phase 2: extract runtime boundaries

Implement the minimal shared interfaces:

- `createDb()`
- `createAuth()`
- `readRuntimeConfig()`
- `readSecret()`
- `exportRuntimeConfigSnapshot()`
- `createStorageProvider()`

### Phase 3: make PG the first shared profile

Stabilize:

- Node + PG
- Cloudflare + PG

Use this as the main shared path for early runtime-neutral validation.

### Phase 4: add D1 as an install-time database profile

After the PG path is stable, add:

- Cloudflare + D1

This keeps D1 support valuable without forcing the entire architecture to revolve around it.

### Phase 5: add storage providers

Implement in this order:

- local
- s3
- r2

Keep the provider contract stable from day one.

### Phase 6: complete acceptance coverage

Add acceptance coverage for:

- Better Auth email/password flow
- Better Auth social flow
- session reads and sign-out invalidation
- runtime config resolution
- PG profile
- D1 profile
- storage provider behavior where feasible

## Non-goals for this phase

Avoid the following for now:

- a complex plugin framework for runtime targets
- splitting the app into separate Node and Worker products
- treating Vercel as a first-class baseline before the native runtime model is stable
- over-abstracting every service before the first runtime boundary is proven useful

## Expected end state

After this plan is complete, Logicstarter should behave like:

- a native Cloudflare-first starter
- a Worker-compatible core product
- a Node-compatible runtime path
- an install-time selectable database system (`pg` or `d1`)
- a provider-driven infrastructure surface for auth, messaging, and storage

At that point, a Vercel version becomes a true adaptation layer built on top of an already-native starter, rather than a core design constraint.
