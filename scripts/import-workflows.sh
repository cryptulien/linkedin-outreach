#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CID="$(docker compose -f "$ROOT/docker-compose.yml" ps -q n8n)"
if [[ -z "$CID" ]]; then
  echo "n8n container not running — make up first" >&2
  exit 1
fi
for f in "$ROOT"/workflows/*.json; do
  base="$(basename "$f")"
  docker cp "$f" "$CID:/tmp/$base"
  docker exec "$CID" n8n import:workflow --input="/tmp/$base"
  echo "imported $base (inactive — activate in UI or via n8n update:workflow)"
done
echo "Restart n8n to pick up imports if needed: docker compose restart n8n"
