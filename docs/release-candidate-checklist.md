# Logicstarter Release Candidate Checklist

Use this checklist before declaring the current Better Auth-based codebase ready to remain the effective starter mainline in practice and before completing the final GitHub replacement of the legacy starter public identity.

## 1. Configuration safety

- Confirm no real secrets are committed to the repository.
- Keep `.env`, `.env.runtime`, and any production secret files untracked.
- Keep `.env.example` and `.env.runtime.example` aligned with the current runtime surface.
- Confirm `SETTINGS_SECRET_KEY`, `BETTER_AUTH_SECRET`, Stripe keys, mail keys, and storage keys are documented but not committed.

## 2. Baseline validation

- Run `pnpm typecheck`.
- Run `pnpm build`.
- Run `pnpm smoke:baseline`.
- Confirm `/api/providers/runtime` reports the expected runtime status.
- Confirm `/settings/providers` shows the expected operator cards.

## 3. Auth validation

- Validate email/password sign-in.
- Validate first-admin bootstrap behavior on a fresh install.
- Validate at least one social provider path if it is enabled.
- Run `pnpm smoke:auth-real` with a verified user.

## 4. Billing validation

- Confirm `/api/billing/runtime` reports healthy readiness.
- Validate checkout route auth and method contracts.
- Validate webhook route auth/signature handling in the target runtime.
- Validate `GET /api/billing/state` for an authenticated user.
- Validate `POST /api/billing/sync` as an operator repair path.
- Run `pnpm smoke:billing-real` with:
  - `LOGICSTARTER_TEST_EMAIL`
  - `LOGICSTARTER_TEST_PASSWORD`
  - `LOGICSTARTER_STRIPE_TEST_PRICE_ID`
- Confirm the smoke user exists and is verified before running the script.
- Confirm the Stripe test account actually contains an active recurring price.
- Record the specific recurring Stripe test price used for the successful run.
- Record the successful execution result so future work does not misclassify billing as still blocked by missing application logic.

## 5. Storage validation

- Confirm `/api/storage/runtime` reports the intended storage provider.
- Validate signed URL or upload behavior for the chosen provider.
- Run `pnpm smoke:storage-real`.
- Confirm uploaded files are retrievable and deletable.

## 6. Deployment readiness

- Confirm Node deployments load `.env` and `.env.runtime` correctly.
- Confirm Cloudflare deployments use bindings and secrets as the source of truth.
- Confirm billing, auth, mail, SMS, and storage settings are represented in deployment docs.
- Confirm operator instructions in `/settings/providers` match the actual deployment model.

## 7. Replacement decision

The current codebase is ready to complete the final GitHub starter replacement when all of the following are true:

- Baseline checks pass.
- Sensitive configuration is clean.
- Example env files are complete.
- Auth validation is complete.
- Storage validation is complete.
- Billing validation is complete, including one real Stripe checkout test.
- The migration notes are accurate and tested.
- The GitHub transition handoff is complete and reviewed.
- The starter-side backup and rollback expectations are documented.
- The Better Auth comparison in `docs/better-auth-current-version-comparison.md` is current before any Better Auth upgrade work begins.
- The AI execution guidance in `docs/ai-windsurf-operations.md` is current before delegating follow-up work.

If billing is the only remaining gap, the project can still be treated as the effective starter baseline in day-to-day work, but not yet as the final public GitHub starter identity.
