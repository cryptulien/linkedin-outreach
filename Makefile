.PHONY: up down logs dry-run-smoke test import-workflows live-runner

up:
	cp -n .env.example .env 2>/dev/null || true
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f grok-runner

test:
	cd grok-runner && npm test

dry-run-smoke:
	./scripts/dry-run-smoke.sh

import-workflows:
	./scripts/import-workflows.sh

# LIVE must run on the host so `grok -p` can use OAuth (~/.grok/auth.json)
# and computer-use / browser. Do not set GROK_API_KEY or XAI_API_KEY.
live-runner:
	@test -f "$${GROK_HOME:-$$HOME/.grok}/auth.json" || (echo "Missing OAuth session. Run: grok login   or   grok login --device-auth" >&2; exit 1)
	@if [ -n "$${GROK_API_KEY:-}" ] || [ -n "$${XAI_API_KEY:-}" ]; then echo "Unset GROK_API_KEY and XAI_API_KEY — use OAuth subscription only." >&2; exit 1; fi
	cd grok-runner && PROMPTS_DIR=../prompts npm run build && PROMPTS_DIR=../prompts DRY_RUN=false npm start
