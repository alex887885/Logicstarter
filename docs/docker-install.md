# Logicstarter Docker Install

Use this guide when you want to bootstrap Logicstarter as a reusable starter template in a local Docker-based environment.

## What this setup provides

- a Node 22 container for the Logicstarter app
- a PostgreSQL 16 container for the application database
- a persisted Docker volume for PostgreSQL data
- a bind-mounted `uploads/` directory for local storage testing

## Files used by this setup

- `Dockerfile`
- `docker-compose.yml`
- `.env.docker.app`
- `.env.docker.db`
- `.env.docker.runtime`
- `uploads/`

## 1. Prepare env files

Copy the example env files before you start:

```bash
cp .env.docker.example .env.docker.app
cp .env.docker.db.example .env.docker.db
cp .env.docker.runtime.example .env.docker.runtime
```

Then update at minimum:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `APP_ORIGIN`
- `SETTINGS_SECRET_KEY`
- `STRIPE_SECRET_KEY` if billing validation is required
- `STRIPE_PUBLISHABLE_KEY` if billing validation is required
- `STRIPE_WEBHOOK_SECRET` if webhook validation is required

For the provided `docker-compose.yml`, keep the Postgres variables and database URL aligned across `.env.docker.db` and `.env.docker.app`:

```env
POSTGRES_DB=logicstarter
POSTGRES_USER=logicstarter
POSTGRES_PASSWORD=replace-with-a-strong-local-password
LOGICSTARTER_DOCKER_POSTGRES_PORT=55432
DATABASE_URL=postgres://logicstarter:replace-with-a-strong-local-password@db:5432/logicstarter
```

If you are only bootstrapping locally, keep these values aligned in `.env.docker.app` or `.env.docker.runtime`:

```env
BETTER_AUTH_URL=http://localhost:5000
APP_ORIGIN=http://localhost:5000
RUNTIME_TARGET=node
```

## 2. Start the stack

```bash
docker compose up --build
```

This starts:

- `db` on host port `55432` by default
- `app` on port `5000`

## 3. Run database migration

In a second shell, run:

```bash
docker compose exec app pnpm db:migrate
```

If you regenerate schema artifacts later, you can also run:

```bash
docker compose exec app pnpm db:generate
```

## 4. Open the app

Use:

```text
http://localhost:5000
```

Verify at minimum:

- homepage loads
- auth pages render
- `/settings/providers` loads
- `/api/providers/runtime` returns the expected runtime snapshot

## 5. Common validation commands

Run inside the app container:

```bash
docker compose exec app pnpm typecheck
docker compose exec app pnpm build
docker compose exec app pnpm smoke:baseline
```

Optional real validation commands:

```bash
docker compose exec app pnpm smoke:auth-real
docker compose exec app pnpm smoke:storage-real
docker compose exec app pnpm smoke:billing-real
```

## 6. Local starter-template workflow

When using Logicstarter as the baseline for a new project:

1. Copy this repository into the new project location.
2. Replace project-specific names, domains, and branding.
3. Generate fresh secrets.
4. Point `DATABASE_URL` to the new project database.
5. Review `/settings/providers`, disable providers you do not need, and confirm the runtime snapshot matches the intended env-based deployment model.
6. Run the baseline validation commands before first deployment.

For new product lines, keep runtime env and deployment secrets as the source of truth for provider configuration.
Do not restore DB-backed provider settings as the default posture.

## 7. GitHub transition note

This Docker setup is for local bootstrap and starter-template reuse.

It does not complete the public GitHub starter cutover by itself.
For repository transition status and final public replacement rules, also read:

- `README.md`
- `docs/github-transition-handoff.md`
- `docs/plans/logicstarter-github-transition-plan.md`
- `docs/release-candidate-checklist.md`

## 8. Stop and reset

Stop the stack:

```bash
docker compose down
```

Stop and remove PostgreSQL data volume:

```bash
docker compose down -v
```

Only use `docker compose down -v` when you intentionally want to discard local database state.
