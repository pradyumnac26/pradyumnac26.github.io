#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VAULT="${VAULT_PATH:-$ROOT/../mypersonalwiki}"
CONTENT="$ROOT/content"

if [[ ! -d "$VAULT" ]]; then
  echo "Vault not found: $VAULT" >&2
  echo "Set VAULT_PATH if your Obsidian vault lives elsewhere." >&2
  exit 1
fi

rsync -av \
  --exclude='.git/' \
  --exclude='.DS_Store' \
  --exclude='.obsidian/workspace.json' \
  --exclude='.obsidian/workspace-mobile.json' \
  "$VAULT/" "$CONTENT/"

echo "Synced vault → content/"
echo "  from: $VAULT"
echo "  to:   $CONTENT"
