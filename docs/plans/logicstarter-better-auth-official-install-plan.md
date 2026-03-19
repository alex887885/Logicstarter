---
description: Logicstarter official Better Auth install plan
---

# Logicstarter Better Auth Official Install Plan

## 1. Execution Rules

- Better Auth official path comes first.
- Before official capabilities are fully installed, do not add custom abstraction layers.
- Do not add custom auth runtime wrappers, provider registries, or plugin orchestration layers before the official chain is complete.
- Runtime port must be controlled by the environment, not hardcoded in application logic.
- Database credentials belong in env/example and runtime configuration, not in application logic.
- First complete the official Better Auth baseline, then add starter-style modal UX and external adaptations.

## 2. Round 1 Goal

Build the official Better Auth minimum React Router v7 baseline with Drizzle adapter and CLI readiness.

This round should produce a stable base with:

- Better Auth server instance
- Better Auth React client
- React Router v7 catch-all auth route
- Drizzle adapter wiring
- Better Auth CLI entry
- Drizzle migration workflow entry
- minimal env template

No custom modal flow, infra layer, or settings abstraction should be added in this round.

## 3. Packages to Install in This Round

### Core app and framework

- `react`
- `react-dom`
- `react-router`
- `@react-router/dev`
- `@react-router/node`
- `@react-router/serve`
- `vite`
- `typescript`
- `@types/node`
- `@types/react`
- `@types/react-dom`

### Better Auth core

- `better-auth`
- `zod`

### Database and ORM

- `drizzle-orm`
- `drizzle-kit`
- `postgres`

### Better Auth official database path

- Better Auth Drizzle adapter package required by the official Drizzle path

## 4. Official Capabilities to Include in This Round

### Must include now

- Better Auth RR7 server integration
- Better Auth React client integration
- Drizzle adapter integration
- Better Auth CLI generate entry
- Drizzle migration entry
- server-side session retrieval using `auth.api.getSession`

### Do not include yet

- custom login modal flow
- custom provider registry
- custom payment abstraction
- custom settings runtime layer
- Cloudflare-specific wrappers
- infra dashboard wiring
- audit logs wiring
- email service wiring
- sms service wiring
- organization plugin wiring

These will be added only after the official baseline is complete and verified.

## 5. Files to Create or Recreate in One Pass

### Root files

- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `react-router.config.ts`
- `.gitignore`
- `.env.example`
- `auth.ts`
- `drizzle.config.ts`

### App files

- `app/app.css`
- `app/types.d.ts`
- `app/routes.ts`
- `app/root.tsx`
- `app/routes/_index.tsx`
- `app/routes/api.auth.$.tsx`
- `app/lib/auth.server.ts`
- `app/lib/auth-client.ts`
- `app/lib/auth.client.ts`
- `app/db/index.server.ts`
- `app/db/schema.ts`

## 6. Env Policy

### Minimum env for this round

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

### Keep out of app logic

- fixed port values
- concrete deployment host assumptions
- container-specific paths
- 1Panel-specific runtime assumptions

### Database example values

Use the user-provided database baseline in `.env.example`:

- database name: `logicstarter`
- database username: `logicstarter`
- database password: `nc195826`

This information should stay in env/example only, not be duplicated in application logic.

## 7. Official Integration Shape

### Server

- `auth.ts` should export `auth` from the app auth server file
- `app/lib/auth.server.ts` should contain `export const auth = betterAuth({...})`
- Drizzle adapter should be wired here

### Route

- `app/routes/api.auth.$.tsx`
- `loader` returns `auth.handler(request)`
- `action` returns `auth.handler(request)`

### Client

- `app/lib/auth-client.ts`
- `createAuthClient` from `better-auth/react`
- no custom wrapper logic beyond compatibility re-export file if needed

### Root loader

- `auth.api.getSession({ headers: request.headers })`
- no custom auth facade in round 1

## 8. CLI and Migration Workflow

### Better Auth CLI

Need official CLI command path for schema generation.

Target:

- `npx auth@latest generate --config ./auth.ts --yes`

If explicit output is needed for Drizzle schema, it must use Better Auth official CLI options only.

### Drizzle workflow

After Better Auth schema generation:

- `drizzle-kit generate`
- `drizzle-kit migrate`

Round 1 only needs the commands and file structure ready.

## 9. Version Policy

- Prefer exact versions for the installed baseline to reduce drift.
- Do not upgrade packages casually during installation.
- If peer warnings appear, record them first and decide deliberately rather than silently swapping versions.

## 10. Round 1 Acceptance Criteria

Round 1 is complete only when all of the following are true:

- official Better Auth RR7 route exists
- official Better Auth React client exists
- Drizzle adapter is wired
- CLI path for Better Auth schema generation is present
- Drizzle migration path is present
- root loader can read session through official Better Auth API shape
- no custom auth abstraction layer has been introduced
- application code does not hardcode external runtime port

## 11. Round 2 After This Plan

Only after round 1 is done:

- add organization plugin
- add infra dashboard and audit logs
- add email service and sms service
- add starter-style modal login flow
- add settings-driven provider configuration
- evaluate Cloudflare-specific adaptation

## 12. Execution Order for the Actual Install Pass

1. Recreate all round 1 files in one pass.
2. Install official packages in the container with `pnpm`.
3. Run typecheck and build.
4. Add Drizzle adapter and CLI command wiring if any file path adjustments are needed.
5. Prepare Better Auth schema generation path.
6. Stop and verify round 1 acceptance criteria before any plugin or UI migration work.
