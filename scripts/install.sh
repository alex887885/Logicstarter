#!/usr/bin/env sh
set -eu

if [ ! -f .env ]; then
  cp .env.example .env
fi

if grep -q "replace-with-a-long-random-secret" .env 2>/dev/null; then
  SECRET_VALUE=$(date +%s | sha256sum | cut -c1-48)
  sed -i "s/replace-with-a-long-random-secret-at-least-32-characters/${SECRET_VALUE}/g" .env
  sed -i "s/replace-with-a-long-random-secret/${SECRET_VALUE}/g" .env
fi

if ! grep -q '^DATABASE_URL=' .env 2>/dev/null; then
  echo "DATABASE_URL is required in .env before starting Logicstarter." >&2
  exit 1
fi

if grep -q '^DATABASE_URL=$' .env 2>/dev/null; then
  echo "DATABASE_URL must not be empty in .env before starting Logicstarter." >&2
  exit 1
fi

if grep -q '^BETTER_AUTH_SECRET=$' .env 2>/dev/null; then
  echo "BETTER_AUTH_SECRET must not be empty in .env before starting Logicstarter." >&2
  exit 1
fi

if grep -q '^SETTINGS_SECRET_KEY=$' .env 2>/dev/null; then
  echo "SETTINGS_SECRET_KEY must not be empty in .env before starting Logicstarter." >&2
  exit 1
fi

echo "Logicstarter .env is ready."
