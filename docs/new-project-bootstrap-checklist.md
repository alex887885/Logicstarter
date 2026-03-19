# Logicstarter New Project Bootstrap Checklist

Use this checklist when cloning Logicstarter into a new project so the starter baseline stays consistent.

## 1. Identity and branding

- Replace the project name in product copy, metadata, and deployment labels.
- Replace the default domain values in all env templates.
- Replace logos, favicons, screenshots, and social preview assets.
- Review homepage copy so it matches the new product scope.

## 2. Secrets and environment

- Generate a fresh `BETTER_AUTH_SECRET`.
- Generate a fresh `SETTINGS_SECRET_KEY`.
- Create project-specific `.env` and `.env.runtime` files for non-Docker workflows.
- Create project-specific `.env.docker.app`, `.env.docker.db`, and `.env.docker.runtime` files for Docker workflows.
- Replace all placeholder values before any shared environment is used.

## 3. Database and storage

- Create a dedicated PostgreSQL database for the new project.
- Update `DATABASE_URL` to point to the new project database.
- Choose the intended storage provider: local, S3, or R2.
- Confirm upload paths and public asset URLs match the new deployment shape.
- Run database migrations before first interactive testing.

## 4. Auth and provider posture

- Set `BETTER_AUTH_URL`, `APP_ORIGIN`, and `AUTH_CANONICAL_ORIGIN` to the new project domain.
- Disable any auth provider that is not required.
- Replace all Google, GitHub, mail, SMS, and Stripe credentials with project-specific values.
- Review `/settings/providers` and verify the runtime snapshot matches the intended deployment model.
- Treat `/settings/providers` as an env-only workspace for new product lines, with runtime env and deployment secrets as the source of truth.
- Do not reintroduce DB-backed auth or provider settings for new product lines unless the product truly requires operator-managed dynamic overrides.
- If an exception is approved, document the exact override boundary, precedence rules, and rollback path before implementation.
- Create or update a Better Auth integration diff before any future Better Auth upgrade so project-specific drift is documented.

## 5. Docker bootstrap

- Copy `.env.docker.example` to `.env.docker.app`.
- Copy `.env.docker.db.example` to `.env.docker.db`.
- Copy `.env.docker.runtime.example` to `.env.docker.runtime`.
- Set `LOGICSTARTER_DOCKER_POSTGRES_PORT` if the default host port `55432` conflicts locally.
- Run `docker compose up --build`.
- Run `docker compose exec app pnpm db:migrate`.

## 6. Validation baseline

- Run `pnpm typecheck`.
- Run `pnpm build`.
- Run `pnpm smoke:baseline`.
- Run `pnpm smoke:auth-real` when a verified test account is available.
- Run `pnpm smoke:storage-real` when the target storage provider is configured.
- Run `pnpm smoke:billing-real` only when Stripe test credentials, a verified smoke user, and a valid recurring price all exist.

## 7. Operational docs

- Review `docs/docker-install.md`.
- Review `docs/better-auth-current-version-comparison.md` before any Better Auth upgrade work.
- Review `docs/ai-windsurf-operations.md` before delegating work through AI or Windsurf.
- Review `docs/migration-from-starter.md` if this project is replacing an older deployment.
- Review `docs/release-candidate-checklist.md` before any release candidate is declared.
- Review `docs/github-transition-handoff.md` and `docs/plans/logicstarter-github-transition-plan.md` if the repository identity will replace a legacy starter repo.

## 8. Exit criteria

Do not treat the new project as ready until:

- env files are project-specific
- secrets are rotated
- branding is updated
- migrations are applied
- runtime views are correct
- baseline validation passes
