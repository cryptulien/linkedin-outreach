# LinkedIn Outreach — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a clonable `linkedin-outreach` repo (sector-agnostic) with n8n + grok-runner in DRY_RUN, smoke-testable without LinkedIn.

**Architecture:** n8n orchestrates (crons); `grok-runner` (Node 20/TS) runs HTTP jobs; Twenty external or file mock; Discord webhook for alerts + validation digests.

**Tech Stack:** Docker Compose, n8n, Node 20, TypeScript, Fastify, Vitest, Make.

**Spec:** `docs/design-spec.md` (canonical copy in this repo)

## Global Constraints

- `DRY_RUN=true` by default — no LinkedIn actions
- Invitation **with no note**; DMs only after human validation
- Caps: 10 invites/day; acceptances 1×/week; random delays (simulated in dry-run)
- No secrets in git
- Propose → status `message_a_valider`; Discord = alerting + DM validation (v0)

---

### Task 1: Scaffold repo + Compose + README

**Files:**
- Create: `/root/linkedin-outreach/` (git init)
- Create: `docker-compose.yml`, `.env.example`, `.gitignore`, `Makefile`, `README.md`

- [x] **Step 1:** Init git + root files (compose n8n:5679 + grok-runner:8090, network, env)
- [x] **Step 2:** 5-minute README (clone → cp .env → compose up → make dry-run-smoke)
- [x] **Step 3:** Commit `chore: scaffold repo`

---

### Task 2: grok-runner — healthz + types + mock store

**Files:**
- Create: `grok-runner/package.json`, `tsconfig.json`, `Dockerfile`, `src/server.ts`, `src/config.ts`, `src/types.ts`, `src/store/mock_twenty.ts`
- Test: `grok-runner/src/server.test.ts`

**Interfaces:**
- Produces: `GET /healthz` → `{ ok: true, dry_run: boolean }`
- Produces: `Prospect` type + `MockTwentyStore` (status CRUD in memory / JSON file)

- [x] **Step 1:** Failing healthz test
- [x] **Step 2:** Fastify server + DRY_RUN config
- [x] **Step 3:** Tests green + commit

---

### Task 3: Jobs invites / acceptances / messages (DRY_RUN)

**Files:**
- Create: `grok-runner/src/jobs/invites.ts`, `acceptances.ts`, `messages.ts`, `discord.ts`, `linkedin/dry_run.ts`
- Test: `grok-runner/src/jobs/*.test.ts`

**Interfaces:**
- `POST /jobs/invites` `{ prospects }` → `{ ok, dry_run, results[] }`
- `POST /jobs/acceptances` same shape
- `POST /jobs/messages/propose` → sets `message_a_valider` + Discord digest (if webhook)
- `POST /jobs/messages/send` `{ prospect_id, decision, text? }` → `message_envoye` on ok

- [x] **Step 1:** Red dry-run job tests (match KO → alerting, propose → message_a_valider)
- [x] **Step 2:** Minimal implementation
- [x] **Step 3:** Green + commit

---

### Task 4: Twenty client + seed + statuses.md

**Files:**
- Create: `grok-runner/src/twenty_client.ts`, `twenty/statuses.md`, `twenty/seed-demo.json`

- [x] **Step 1:** Twenty HTTP client with mock fallback when `TWENTY_MODE=mock`
- [x] **Step 2:** Seed 12 demo prospects
- [x] **Step 3:** Commit

---

### Task 5: n8n workflow JSON + Make import

**Files:**
- Create: `workflows/daily-outreach.json`, `weekly-acceptances.json`, `scripts/import-workflows.sh`

- [x] **Step 1:** Daily schedule 08:30 → HTTP grok-runner
- [x] **Step 2:** Weekly Mon 08:15
- [x] **Step 3:** Documented `make import-workflows` (docker cp + n8n import)
- [x] **Step 4:** Commit

---

### Task 6: Prompts + runbook + dry-run-smoke E2E

**Files:**
- Create: `prompts/*.md`, `docs/runbook.md`
- Modify: `Makefile` (`dry-run-smoke`)

- [x] **Step 1:** Invite / acceptance / message prompts
- [x] **Step 2:** `make dry-run-smoke` curls jobs against runner + seed
- [x] **Step 3:** Verify output; commit; GitHub repo + push

---

## Execution

Completed inline (v0 DRY_RUN). Docs later translated to English.
