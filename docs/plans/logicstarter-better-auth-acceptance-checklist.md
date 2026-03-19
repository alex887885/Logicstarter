---
description: Better Auth acceptance checklist for Logicstarter standard login, persistence, and sign-out behavior
---

# Logicstarter Better Auth Acceptance Checklist

## Scope

This checklist validates that Logicstarter still follows the standard Better Auth login chain and that state is persisted correctly across callback, session read, and sign-out.

## Target

Use the real runtime domain whenever possible:
- `https://starter.logicm8.com/`

## Social sign-in baseline

### 1. Initiation
- Trigger Google sign-in from the login modal.
- Confirm `/api/auth/sign-in/social` returns success and a redirect URL.
- Confirm OAuth state and PKCE cookies are issued.

### 2. Callback
- Complete the Google callback flow.
- Confirm callback returns `302` to the app.
- Confirm a Better Auth session cookie is issued.

### 3. Session reads
- Confirm `root` loader resolves an authenticated session.
- Confirm `/api/auth/get-session` returns `session` and `user`.
- Confirm the homepage header shows the authenticated user.

### 4. Persistence
- Confirm the authenticated user exists in the `user` table.
- Confirm the provider record exists in the `account` table.
- Confirm the active session exists in the `session` table.

### 5. Sign-out
- Sign out from the homepage header.
- Confirm the homepage returns to the logged-out state.
- Confirm `/api/auth/get-session` no longer returns an active session.

## Email/password baseline

### 1. Registration
- Register a new account or initialize the bootstrap administrator.
- Confirm Better Auth verification or setup flow completes as expected.
- If the runtime is still in bootstrap mode, create and verify the first administrator before running the real email/password smoke.

### 2. Sign-in
- Sign in with email and password.
- Confirm session read behavior matches social sign-in.
- Run `pnpm smoke:auth-real` with `LOGICSTARTER_TEST_EMAIL`, `LOGICSTARTER_TEST_PASSWORD`, and `DATABASE_URL` set.
- Confirm the script validates `sign-in -> get-session -> DB user/account/session -> sign-out -> get-session(null)`.

### 3. Reset password
- Trigger reset password.
- Confirm Better Auth calls the configured email send hook.
- Confirm reset link opens and can complete password update.

## Provider configuration baseline

### 1. Settings source resolution
- Confirm env overrides take precedence when explicitly configured.
- Confirm DB-backed provider settings are used when env overrides are absent.
- Confirm provider export output matches the active settings values.

### 1.1 Storage runtime
- Confirm `/api/storage/runtime` returns the active storage provider and runtime snapshot.
- Confirm the homepage storage panel shows the current provider, local path, public base URL, and upload policy.
- Confirm `pnpm smoke:baseline` covers anonymous upload/delete rejection and missing `/uploads/...` file handling.

### 2. Messaging
- Confirm email send path works for the selected provider.
- Confirm SMS send path works for the selected provider when phone auth is enabled.

### 3. Authenticated storage flow
- Sign in with a verified test account.
- Upload a small allowed file from the homepage storage panel or by calling `/api/storage/upload`.
- Confirm the returned URL is readable.
- Delete the uploaded file through the homepage panel or `/api/storage/delete`.
- Confirm the deleted file URL returns `404`.
- Run `pnpm smoke:storage-real` with `LOGICSTARTER_TEST_EMAIL` and `LOGICSTARTER_TEST_PASSWORD` set to validate the full authenticated `sign-in -> upload -> fetch -> delete -> 404 -> sign-out` flow.

## Cleanup
- After the baseline is stable, remove temporary auth debug logs.
- Convert repeated manual checks into a smoke script where practical.

## Real auth smoke prerequisites

- `smoke:baseline` should pass before running the real auth smoke.
- The target account must already exist, have a password credential, and be email-verified.
- The runtime must not still be waiting for the bootstrap administrator to be created.
- Use a dedicated test account so the DB-backed `user`, `account`, and `session` assertions remain predictable.
- The same verified dedicated account can be reused for `pnpm smoke:storage-real`.
- `STORAGE_PROVIDER` should remain on a reachable runtime, with `local` using the configured uploads path or its default fallback.
