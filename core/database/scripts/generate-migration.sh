#!/usr/bin/env bash
# TypeORM migration:generate ONLY diffs: entities ↔ live database.
# It does NOT look at pending .ts migration files. If the DB is behind
# pending migrations, generate will re-create tables that already have
# migration files — always apply pending migrations first.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

NAME_OR_PATH="${1:-}"
if [[ -z "$NAME_OR_PATH" ]]; then
  echo "Usage: npm run migration:generate -- <MigrationNameOrPath>"
  echo "Example: npm run migration:generate -- core/database/migrations/AddLabOrders"
  exit 1
fi

echo "==> Pending migrations (must be empty of [ ] before a clean generate):"
npm run migration:show

echo "==> Applying any pending migrations so generate only sees real drift..."
npm run migration:run

echo "==> Generating migration from entity ↔ database diff..."
npm run typeorm -- migration:generate -d core/database/data-source.ts "$NAME_OR_PATH"

echo "==> Done. Review the new file — if it recreates existing tables, the DB was out of sync with entities."
