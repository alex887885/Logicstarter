---
description: Logicstarter Better Auth-first starter implementation plan
---

# Logicstarter Better Auth-first Plan

## 1. Goal

Build `Logicstarter` as a new Better Auth-first starter instead of continuing to evolve the legacy starter as the main line.

The project should use:

- `React Router v7` as the primary framework mode
- `Tailwind CSS` as the styling foundation
- `shadcn/ui` as the component foundation
- `Better Auth` as the primary auth and organization foundation

The project should also be designed so that future official Better Auth plugins can be added with minimal or no architectural rework.

## 2. Runtime Baseline

### Primary runtime

- Framework: `React Router v7`
- UI: `Tailwind CSS` + `shadcn/ui`
- Runtime port: environment-controlled
- Database name: `logicstarter`
- Database username: `logicstarter`

### Environment policy

- Prefer current stable versions of framework and core dependencies at implementation time
- Avoid pinning the architecture to deprecated APIs or legacy compatibility layers unless there is a hard deployment requirement
- Keep version coupling shallow so that Better Auth, RR7, Tailwind, and shadcn upgrades can be evaluated independently

### Secrets policy

- Database passwords, auth secrets, provider secrets, webhook secrets, and signing keys must live in environment variables or deployment secret stores only
- Sensitive values must not be copied into planning docs, source files, fixtures, screenshots, or sample commits
- Local bootstrap docs may describe required variable names, but not hardcode live credentials

## 3. Product Positioning

`Logicstarter` is not a generic product shell.

It is a Better Auth-first starter runtime that provides:

- authentication foundation
- organization and membership foundation
- provider integration foundation
- payment integration foundation
- storage integration foundation
- minimal jobs and webhook processing foundation
- reusable settings and operational surfaces

It should not try to provide a universal business entitlement engine for all future projects.

Business-specific interpretation should remain project-owned, including:

- what each plan means
- what features a subscription unlocks
- what downgrade behavior means
- what product limits or seats mean
- what billing copy and operational UX should say

## 4. Core Architecture Decision

### Decision

Create a new Better Auth-first project and migrate only valuable capabilities from the old starter.

### Reason

The previous starter architecture carries product-shell assumptions and runtime abstractions that are no longer the desired center of gravity.

The new center of gravity must be:

- Better Auth as the primary auth model
- Better Auth organization as the primary organization model where applicable
- thin adapters for providers
- thin facades for app consumption
- project-owned business logic

### Resulting rule

Do not port old starter abstractions into Logicstarter unless they still make sense under a Better Auth-first model.

## 5. Main Design Principles

### Better Auth-first

- Better Auth owns its official auth model and plugin model
- Official Better Auth tables should remain clearly separated from app extension tables
- Future official Better Auth plugins should be attachable without large refactors

### Thin integration layer

Keep only thin layers for:

- provider configuration
- provider transport adapters
- facade functions used by the app
- webhook entrypoints
- durable background processing where required

### Project-owned business meaning

Do not prebuild a universal runtime for:

- entitlement interpretation
- feature gating semantics
- plan-to-feature mapping
- billing lifecycle business behavior

These belong in each product.

### Upgrade isolation

- Better Auth schema ownership must remain on the Better Auth side
- Local application code should integrate through stable local facades and extension tables
- Avoid direct plugin-specific logic being scattered across route loaders, UI components, and business services

### Deployment portability

The starter should be intentionally designed to support:

- mainline RR7 deployment
- RR7 adaptation for Cloudflare Workers
- a Next.js adaptation for Vercel

This does not mean one codebase must force a lowest-common-denominator runtime model. It means shared foundations and boundaries should make both variants feasible without rewrite-level pain.

## 6. Required Capability Layers

## 6.1 Auth foundation

The auth layer should support:

- Better Auth core session flows
- email and password where enabled
- social providers where enabled
- phone auth plugins where enabled
- email verification and email OTP flows where enabled
- bearer or JWT style machine/service auth only if needed by actual runtime surfaces
- SSO plugins as optional future add-ons

Rules:

- auth initialization should live in one authoritative module
- plugin registration must be modular and additive
- plugin-specific env validation should be isolated
- route code should consume a stable local auth facade, not construct auth logic inline

## 6.2 Organization foundation

The organization layer should assume Better Auth organization is the main organization source when the plugin is enabled.

Rules:

- memberships, invitations, teams, and org roles should follow Better Auth primitives first
- local tables should only hold extension data that Better Auth does not own
- business-level fields should be attached via extension tables keyed to Better Auth entities
- project code should consume an organization facade instead of touching raw plugin data models everywhere

## 6.3 Payment foundation

The payment layer should be Better Auth-first in integration, but not business-owned by the starter.

Starter-owned responsibilities:

- provider wiring
- checkout/session wiring
- customer/subscription synchronization
- webhook ingestion
- durable delivery and retry for integration-critical events
- basic operational visibility

Project-owned responsibilities:

- business entitlement meaning
- plan interpretation
- seat logic
- product gating
- downgrade policy
- business emails and post-payment actions

Rules:

- keep one source of truth for subscription facts
- avoid duplicating subscription state into conflicting app-owned models
- treat provider facts and Better Auth payment/plugin facts as system-of-record inputs
- map them into product-level interpretation in a separate product-owned layer

## 6.4 Email foundation

The starter should provide:

- adapter contract for transactional email sending
- Better Auth email-related flows integration
- provider configuration support for services such as Resend or SMTP-based providers
- template composition and delivery abstraction kept thin

The starter should not predefine all product email semantics.

## 6.5 SMS / phone foundation

The starter should provide:

- adapter contract for SMS/OTP delivery
- Better Auth phone plugin integration points
- provider configuration support for one or more SMS vendors
- retry and observability hooks for failed sends where needed

The starter should not embed vendor-specific business semantics into the core runtime.

## 6.6 Storage foundation

Storage should remain a separate adapter layer.

Rules:

- no auth-provider-specific assumptions in storage APIs
- support local and cloud-backed object storage strategies
- keep signed URL and upload policy logic in a bounded module
- ensure future products can plug document/media flows without coupling to auth internals

## 6.7 Jobs and webhook foundation

Keep only minimal jobs infrastructure.

Jobs should exist for:

- durable webhook handling
- retry and backoff
- compensation for integration failures
- non-interactive provider sync tasks
- email/SMS delivery reliability where synchronous execution is unsafe

Jobs should not become a generic internal workflow engine unless a concrete product needs it.

## 7. Framework Strategy

## 7.1 RR7 primary implementation

RR7 should be the reference implementation and first shipping target.

This version should define:

- app structure
- route conventions
- server-only boundaries
- DB integration shape
- Better Auth integration shape
- settings and operational surface patterns
- facade and adapter patterns

RR7 should not be forced to mimic Next.js conventions internally.

## 7.2 Next.js + Vercel adaptation track

The goal is to make a Next.js adaptation practical, not to contort the RR7 app into a framework-neutral abstraction soup.

Recommended approach:

- define framework-agnostic core packages for adapters, facades, config parsing, env validation, DB schema, and provider integration
- keep framework binding code thin and separate
- document which modules are safe for `Next.js` server actions, route handlers, and edge/serverless environments
- isolate any RR7-only request/response helpers away from shared core logic

Expected reusable layers:

- database schema and query modules
- Better Auth configuration assembly
- provider adapters
- webhook processing modules
- validation and config modules
- business service boundaries

Expected framework-specific layers:

- routing
- request lifecycle glue
- session retrieval wrappers
- page/layout composition
- framework-specific caching and streaming behavior

## 7.3 RR7 + Cloudflare Workers adaptation track

The goal is to keep CF Workers viability open from day one.

Rules:

- isolate Node-only dependencies behind server adapters
- explicitly track which modules require Node APIs
- prefer standards-based request/response patterns where practical
- keep filesystem assumptions out of shared business code
- treat long-running/background work as externalized or queue-driven when targeting workers
- document incompatible libraries early instead of discovering them deep into implementation

This means the starter should have a portability matrix that labels each module as:

- RR7 Node-safe
- Next.js server-safe
- CF Worker-safe
- requires alternate adapter

## 8. UI Foundation

UI baseline should be:

- `Tailwind CSS`
- `shadcn/ui`
- English copy for finished screens
- consistent visual language across auth, settings, billing, org, and operational pages

Rules:

- keep component theming simple and stable
- avoid embedding business-specific branding assumptions into the core starter
- prefer a small design token surface that can survive both RR7 and Next.js variants
- keep forms, tables, dialogs, command/search patterns, and settings primitives reusable

## 9. Better Auth Plugin Compatibility Rules

Logicstarter must be built so future Better Auth plugin additions do not require architecture rework.

Mandatory rules:

- auth plugin registration must be composable and centralized
- plugin-specific tables must not be redefined by app-owned schema in conflicting ways
- extension fields must live in separate app-owned tables where possible
- route handlers must depend on local facades, not raw plugin internals
- config validation must be segmented by plugin
- optional plugin enablement must not break unrelated runtime surfaces
- plugin UI entrypoints must be additive, not invasive
- plugin webhooks must plug into the same durable inbound processing model
- avoid assumptions that email, phone, org, admin, payment, or SSO is the final plugin surface

The architecture should assume more plugins will arrive later.

## 10. Suggested Repo Structure

A recommended direction:

```text
Logicstarter/
  app/
    routes/
    components/
    features/
  core/
    auth/
    org/
    payment/
    email/
    sms/
    storage/
    jobs/
    observability/
    config/
  lib/
    db/
    validation/
    utils/
  docs/
    plans/
    architecture/
  packages/            # optional, if/when shared modules are extracted
    runtime-core/
    ui/
    adapters/
```

Notes:

- start as a single app if that keeps delivery faster
- only extract packages when there is real reuse pressure
- if Next.js adaptation becomes active, shared modules can move into `packages` later

## 11. Configuration and Secrets Strategy

Configuration must be divided into:

- required core runtime config
- optional provider config
- optional plugin config
- deployment target config

Recommended examples:

- core auth secret
- app base URL
- database URL
- email provider config
- SMS provider config
- storage provider config
- payment provider config
- webhook secrets
- deployment target flags

Rules:

- validate at startup with clear failure messages
- separate public env from server-only env
- provide example env templates without live values
- document minimal env required for boot and optional env required per plugin

## 12. Observability and Operations

The starter should include first-class operational visibility for integration surfaces.

Minimum expectations:

- structured logs
- request correlation IDs where practical
- provider webhook traceability
- failed job visibility
- provider send failure visibility for email and SMS
- migration/version visibility
- health and readiness surfaces suitable for container runtime

The starter should not hide integration failures behind silent retries.

## 13. Testing Strategy

The new starter should define test layers early.

Minimum layers:

- unit tests for config parsing, validation, and pure services
- integration tests for auth, org, webhook, and provider adapters
- route-level smoke coverage for critical public and operator flows
- migration verification for Better Auth and extension-table coexistence
- deployment-target checks for RR7 baseline and portability-sensitive modules

Recommended gating:

- typecheck
- lint
- unit tests
- integration tests
- smoke baseline for critical routes and auth flows

## 14. Implementation Phases

## Phase 0: Planning and architecture baseline

Deliverables:

- this plan
- architecture decision records for Better Auth-first boundaries
- initial portability matrix for RR7, Next.js, and CF Workers
- dependency selection baseline using current stable releases at implementation time

## Phase 1: Project scaffold

Deliverables:

- RR7 app scaffold
- Tailwind setup
- shadcn/ui setup
- env/config validation base
- database connection base
- initial docs and operational scripts
- environment-controlled runtime baseline

## Phase 2: Better Auth core integration

Deliverables:

- Better Auth base setup
- modular plugin registration design
- session retrieval facade
- user provisioning boundary decisions
- auth-related schema generation and migration workflow

## Phase 3: Organization and settings foundation

Deliverables:

- Better Auth organization integration
- extension table strategy
- org facade
- settings surfaces for foundational runtime configuration
- basic operator/admin operational views only where justified

## Phase 4: Provider adapters

Deliverables:

- email adapter contract and first provider implementation
- SMS adapter contract and first provider implementation
- storage adapter contract and first provider implementation
- payment adapter/provider integration baseline

## Phase 5: Webhooks and minimal jobs

Deliverables:

- durable webhook ingestion model
- retry/backoff handling
- job visibility basics
- provider failure handling paths

## Phase 6: Portability hardening

Deliverables:

- identify Node-only modules
- isolate runtime-specific bindings
- prepare Next.js adaptation notes
- prepare CF Workers adaptation notes
- produce module portability matrix

## Phase 7: Migration of valuable assets

Candidate migrations from the old starter or related projects:

- useful env/config patterns
- operational pages worth keeping
- reusable UI pieces
- storage integration patterns
- email/SMS provider patterns
- job/webhook reliability patterns

Do not migrate:

- heavy product-shell assumptions
- generic entitlement engines
- starter-owned business meaning layers
- unnecessary legacy compatibility surfaces

## 15. Risks and Guardrails

### Risk: accidental recreation of old starter complexity

Guardrail:

- require every new module to declare whether it is starter-core or product-owned

### Risk: Better Auth plugin conflicts after future expansion

Guardrail:

- preserve plugin ownership boundaries and avoid app-owned schema collisions

### Risk: framework portability becomes theoretical only

Guardrail:

- maintain a real portability matrix and mark runtime assumptions early

### Risk: jobs grow into a generic internal platform too early

Guardrail:

- keep jobs minimal unless a concrete product requirement justifies expansion

### Risk: provider integrations leak secrets or create hidden coupling

Guardrail:

- centralize env parsing, secret handling, and provider adapter boundaries

## 16. Recommended Immediate Next Steps

1. Confirm the project folder naming convention and whether `Logicstarter` should remain capitalized on disk or be normalized later
2. Scaffold the RR7 app in this directory using current stable dependency versions
3. Establish Tailwind and shadcn/ui immediately so all future runtime surfaces share one UI baseline
4. Define the Better Auth integration module layout before building any auth pages
5. Define the DB and migration workflow so Better Auth tables and app extension tables can coexist cleanly
6. Add a portability matrix doc for RR7, Next.js, and CF Workers before framework-specific assumptions spread
7. Add the first architecture decision record covering Better Auth schema ownership and thin facade rules

## 17. Non-goals for the first implementation

The first implementation should not try to solve all future product problems.

Not first priorities:

- universal entitlement engine
- universal billing semantics
- giant admin backoffice
- complex product theming system
- multi-product plugin marketplace model
- premature package splitting

## 18. Success Criteria

Logicstarter is successful when:

- RR7 baseline runs cleanly with environment-controlled runtime configuration
- Better Auth is the clear auth and org center of gravity
- official Better Auth plugins can be added without deep refactors
- payment, email, SMS, and storage all have thin adapter boundaries
- business meaning stays out of the core starter runtime
- shared modules are portable enough that Next.js and CF Worker adaptation remain practical
- the project remains simpler than the old starter, not more abstract than it
