#!/usr/bin/env bash
set -euo pipefail
BASE="${RUNNER_URL:-http://127.0.0.1:8090}"

echo "== healthz =="
curl -sf "$BASE/healthz" | tee /tmp/loh-health.json
echo

echo "== invites (max 10 from store) =="
curl -sf -X POST "$BASE/jobs/invites" -H 'content-type: application/json' -d '{}' | tee /tmp/loh-invites.json
echo

echo "== acceptances =="
curl -sf -X POST "$BASE/jobs/acceptances" -H 'content-type: application/json' -d '{}' | tee /tmp/loh-acc.json
echo

echo "== propose messages =="
curl -sf -X POST "$BASE/jobs/messages/propose" -H 'content-type: application/json' -d '{}' | tee /tmp/loh-propose.json
echo

# If p12 proposed, send ok
if grep -q '"p12"' /tmp/loh-propose.json; then
  echo "== send p12 ok =="
  curl -sf -X POST "$BASE/jobs/messages/send" \
    -H 'content-type: application/json' \
    -d '{"prospect_id":"p12","decision":"ok"}' | tee /tmp/loh-send.json
  echo
fi

echo "== done (DRY_RUN expected true) =="
grep -q '"dry_run":true' /tmp/loh-health.json
grep -q '"dry_run":true' /tmp/loh-invites.json
echo "OK smoke"
