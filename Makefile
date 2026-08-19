.PHONY: up down logs dry-run-smoke test import-workflows

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
