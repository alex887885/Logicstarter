# Better Auth Current Version Comparison

This document compares the current Better Auth integration across the active project lines only.

## Scope

This comparison intentionally excludes the deprecated original starter baseline.

The active comparison targets are:

- `Logicstarter`
- `newsign`
- `logicsign`

The purpose is upgrade safety.

This document is not a request to change Better Auth internals.
It is a compatibility map for future Better Auth upgrades so project-specific integration drift can be identified before upgrading.

## Why this document exists

Better Auth upgrades usually break at the project integration layer, not because Better Auth itself is wrong, but because each project wires it differently.

The main upgrade risks in this workspace are:

- different plugin surfaces
- different auth origin resolution strategies
- different provider configuration sources
- different email verification behavior
- different client setup conventions
- different route wrappers and debug behavior

## Version snapshot

| Project | `better-auth` version | Notable Better Auth related packages |
| --- | --- | --- |
| `Logicstarter` | `1.5.5` | `@better-auth/i18n`, `@better-auth/infra`, `@better-auth/sso`, `@better-auth/stripe`, `better-auth-cloudflare` |
| `newsign` | `^1.5.4` | core only |
| `logicsign` | `^1.5.4` | core only |

## Server-side integration comparison

### Logicstarter

`Logicstarter` is the richest Better Auth integration in the workspace.

Key characteristics:

- runtime-aware auth bootstrap
- request-aware origin detection
- runtime env fallback chain
- plugin-based expansion
- Node and Cloudflare runtime handling
- Stripe plugin enabled conditionally
- organization support
- phone number support
- i18n support
- SSO support
- Better Auth infra client support

Key integration traits:

- `baseURL` is derived from request origin or configured auth origin
- `trustedOrigins` are built from request and runtime config candidates
- `BETTER_AUTH_SECRET` is mandatory
- cookies are configured explicitly
- `account.storeStateStrategy` is set to `cookie`
- auth database schema includes org and SSO tables

### newsign

`newsign` is partially aligned with Logicstarter but much thinner.

Key characteristics:

- reuses Logicstarter-style config readers
- only uses core Better Auth features
- no plugin surface beyond core
- PostgreSQL only
- static trusted origin list with localhost fallbacks

Key integration traits:

- `baseURL` comes from runtime config or hardcoded localhost fallback
- `trustedOrigins` include explicit hardcoded local origins
- production requires `BETTER_AUTH_SECRET`
- development falls back to a built-in dev secret
- social providers are rebuilt manually from Logicstarter config data

### logicsign

`logicsign` uses a legacy-style project integration.

Key characteristics:

- async auth factory per request
- provider settings are loaded from the project settings layer
- no advanced Better Auth plugin surface
- PostgreSQL only
- broader social provider matrix than Logicstarter and newsign

Key integration traits:

- `baseURL` and `trustedOrigins` are starter-style runtime reads
- provider credentials come from settings detail reads
- Google, GitHub, Microsoft, and Apple can all be enabled
- auth setup remains tightly coupled to the local provider settings system

## Plugin surface comparison

| Capability | Logicstarter | newsign | logicsign |
| --- | --- | --- | --- |
| Email/password | Yes | Yes | Yes |
| Social auth | Google, GitHub | Google, GitHub | Google, GitHub, Microsoft, Apple |
| Organization plugin | Yes | No | No |
| Phone number plugin | Yes | No | No |
| i18n plugin | Yes | No | No |
| SSO plugin | Yes | No | No |
| Stripe Better Auth plugin | Yes, conditional | No | No |
| Better Auth infra / dash | Yes | No | No |
| Cloudflare Better Auth path | Yes | No | No |

## Auth behavior comparison

### Email verification behavior

| Project | `requireEmailVerification` | `sendOnSignUp` | Notes |
| --- | --- | --- | --- |
| `Logicstarter` | not explicitly set in `emailAndPassword` | `true` | sign-up actively sends verification mail |
| `newsign` | `true` | `true` | stricter password sign-in posture plus sign-up verification send |
| `logicsign` | `true` | `false` | sign-in requires verification but sign-up does not auto-send in the same way |

This is a high-risk upgrade difference because user lifecycle expectations already diverge.

### Social provider sourcing

| Project | Provider source |
| --- | --- |
| `Logicstarter` | `readLogicstarterSocialProviders()` |
| `newsign` | Logicstarter config reader, then rebuilt manually into Better Auth config |
| `logicsign` | local provider settings detail reads |

This matters because config shape drift can silently break auth providers after upgrades.

### Trusted origin strategy

| Project | Strategy |
| --- | --- |
| `Logicstarter` | request-aware normalization plus runtime-config candidates |
| `newsign` | runtime-config values plus hardcoded localhost entries |
| `logicsign` | local project runtime/settings resolution |

This is another upgrade risk point because Better Auth changes around host trust, proxy handling, or cookie origin validation will surface differently in each project.

## Client-side integration comparison

### Logicstarter client

`Logicstarter` client setup includes plugin clients:

- `organizationClient()`
- `dashClient()`
- `ssoClient()`
- `stripeClient()`

It also defines a custom `getSession()` helper that calls `/api/auth/get-session` directly.

### newsign client

`newsign` client setup is minimal.

It uses:

- `createAuthClient()`
- `baseURL` from `window.location.origin` or `https://sign.logicm8.com`
- exported client `getSession` directly from Better Auth client

This means `newsign` does not mirror Logicstarter's custom helper shape.

### logicsign client

`logicsign` client setup is also minimal, but differs from `newsign`.

It uses:

- `createAuthClient()`
- `baseURL` from `window.location.origin` or `http://localhost:9000`
- a custom manual `getSession()` fetch helper

So even the two thinner projects are not aligned with each other.

## Route wrapper comparison

### Logicstarter

Logicstarter uses the Better Auth runtime-aware server integration and is designed around a richer runtime model.

### newsign

`newsign` exposes `auth.handler(request)` through `app/routes/api.auth.$.ts` and adds route-level logging.

Current traits:

- request logging in loader and action
- response status logging in loader and action
- error logging in loader and action

This is useful for debugging, but it is also a drift point if future upgrades require cleaner wrappers or different handler assumptions.

### logicsign

`logicsign` also exposes `auth.handler(request)` through `app/routes/api.auth.$.ts`, but through an async factory.

Current traits:

- per-request `getStarterAuth(request)` call
- no extra route-level console logging in the route file

## Database mapping comparison

| Project | Better Auth schema coverage |
| --- | --- |
| `Logicstarter` | user, session, account, verification, organization, member, invitation, ssoProvider |
| `newsign` | user, session, account, verification |
| `logicsign` | user, session, account, verification |

Schema coverage is a major compatibility boundary.
If a future upgrade assumes plugin-related tables, only Logicstarter is prepared.

## Highest upgrade-risk differences

### 1. Plugin surface mismatch

`Logicstarter` already depends on multiple Better Auth plugins.
`newsign` and `logicsign` do not.

If Better Auth introduces breaking plugin API changes, Logicstarter will be affected first.
If the team later tries to align `newsign` or `logicsign`, that alignment is itself a separate migration risk.

### 2. Secret handling mismatch

`Logicstarter` requires a real secret.
`newsign` allows a dev fallback secret outside production.
`logicsign` uses local project secret resolution.

A future upgrade that tightens secret validation could break the thinner projects in development or staging.

### 3. Origin and proxy handling mismatch

The recent `newsign` logs already show Better Auth warning about skipped rate limiting because client IP could not be determined.

That indicates host, proxy, or trusted proxy posture is already not fully aligned.
Future Better Auth upgrades around IP-based rate limiting, trust model, or secure cookies could break differently per project.

### 4. Verification lifecycle mismatch

`newsign` and `Logicstarter` send verification on sign-up.
`logicsign` does not.

Any Better Auth upgrade that changes verification event timing, default expiry, or required verification behavior will produce different user-facing behavior across projects.

### 5. Client API shape mismatch

- `Logicstarter` defines its own `getSession()` helper
- `newsign` exports Better Auth client `getSession`
- `logicsign` defines another manual `getSession()` helper

This is a practical integration risk if the Better Auth client API changes.

### 6. Configuration source drift around provider settings

`Logicstarter` is moving toward an env-only provider configuration workflow for future product lines.
`logicsign` still reads auth-related provider credentials through its local settings layer.
`newsign` is thinner, but still does not share a single fully standardized configuration boundary with `Logicstarter`.

This matters because Better Auth upgrades usually assume that auth-related inputs such as provider client IDs, secrets, base URLs, and trusted origins are resolved consistently at runtime.
If one project reads those values from runtime env while another still reconstructs them from a settings layer, config drift can look like a Better Auth regression even when the root cause is local configuration source mismatch.

 For future reusable product lines, the lower-risk posture is:
 
 - keep deployment env or deployment secrets as the source of truth
 - treat settings UI as a config generator or export workspace, not as the canonical auth config store
 - avoid introducing auth-provider database state unless the product truly needs operator-managed dynamic overrides

 For Logicstarter-derived new product lines, this should be treated as the default policy:

 - keep `/settings/providers` env-only
 - do not restore DB-backed auth or provider settings by default
 - only allow DB-backed overrides when the product has a clearly defined operator workflow that cannot be satisfied by deployment-managed env
 - document override precedence, ownership, and rollback before approving that exception
 
 ## Recommended upgrade policy
 
 ### 1. Do not modify Better Auth internals
 
 Future compatibility work should happen at the project integration layer only.

That means:

- auth config wrappers
- provider mapping
- trusted origin handling
- route wrappers
- client wrapper consistency
- env and settings normalization

### 2. Treat Logicstarter as the reference integration for future reusable work

`Logicstarter` is the most intentional Better Auth integration.
It should be the reference point for:

- runtime-aware base URL handling
- plugin policy
- auth-related runtime config shape
- future reusable baseline work

### 3. Before upgrading Better Auth, diff these exact files first

- `Logicstarter/package.json`
- `Logicstarter/app/lib/auth.server.ts`
- `Logicstarter/app/lib/auth-client.ts`
- `newsign/package.json`
- `newsign/app/lib/auth.server.ts`
- `newsign/app/lib/auth.client.ts`
- `newsign/app/routes/api.auth.$.ts`
- `logicsign/package.json`
- `logicsign/app/lib/auth.server.ts`
- `logicsign/app/lib/auth.client.ts`
- `logicsign/app/routes/api.auth.$.ts`
- `logicsign/app/providers/auth/login-methods.server.ts`

### 4. Standardize wrappers before major upgrades where possible

Without changing Better Auth internals, the safest alignment work would be:

- normalize client `getSession()` wrapper style
- normalize auth route wrapper behavior
- normalize trusted origin construction posture
- document provider source differences clearly
- standardize on env-first provider configuration for new reusable product lines

### 5. Keep project-level custom behavior out of the Better Auth core boundary

Project-specific provisioning, logging, provider settings reads, and UI-specific helper behavior should remain outside Better Auth internals.

That makes upgrades easier because custom code stays at the boundary.

## Practical conclusion

For current upgrade planning:

- `Logicstarter` is the most complete Better Auth integration
- `newsign` is partially aligned with Logicstarter but still simpler and more hardcoded
- `logicsign` is still a separate legacy-style integration surface

Future Better Auth upgrades should be planned as a three-surface compatibility exercise, not a single shared upgrade.

The first upgrade review should always start with project integration drift, not with patching Better Auth itself.
