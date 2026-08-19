# LinkedIn Outreach Hospitaliers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer un repo clonable `linkedin-outreach-hospitaliers` avec n8n + grok-runner en DRY_RUN, smoke testable sans LinkedIn.

**Architecture:** n8n orchestre (crons) ; `grok-runner` (Node 20/TS) exécute les jobs HTTP ; Twenty externe ou mock fichier ; Discord webhook pour alertes + digests validation.

**Tech Stack:** Docker Compose, n8n, Node 20, TypeScript, Fastify, Vitest, Make.

**Spec:** `docs/superpowers/specs/2026-08-19-linkedin-outreach-hospitaliers-design.md`

## Global Constraints

- `DRY_RUN=true` par défaut — zéro action LinkedIn
- Invitation **sans** note ; DM seulement après validation humaine
- Caps : 10 invites/jour ; acceptances 1×/semaine ; délais aléatoires (simulés en dry-run)
- Aucun secret dans git
- Propose → statut `message_a_valider` ; Discord = alerting + validation DM v0

---

### Task 1: Scaffold repo + Compose + README

**Files:**
- Create: `/root/linkedin-outreach-hospitaliers/` (git init)
- Create: `docker-compose.yml`, `.env.example`, `.gitignore`, `Makefile`, `README.md`

- [ ] **Step 1:** Init git + fichiers racine (compose n8n:5678 + grok-runner:8090, network, env)
- [ ] **Step 2:** README 5 minutes (clone → cp .env → compose up → make dry-run-smoke)
- [ ] **Step 3:** Commit `chore: scaffold repo`

---

### Task 2: grok-runner — healthz + types + mock store

**Files:**
- Create: `grok-runner/package.json`, `tsconfig.json`, `Dockerfile`, `src/server.ts`, `src/config.ts`, `src/types.ts`, `src/store/mock_twenty.ts`
- Test: `grok-runner/src/server.test.ts`

**Interfaces:**
- Produces: `GET /healthz` → `{ ok: true, dry_run: boolean }`
- Produces: `Prospect` type + `MockTwentyStore` (CRUD statut en mémoire / JSON file)

- [ ] **Step 1:** Test failing healthz
- [ ] **Step 2:** Implement Fastify server + config DRY_RUN
- [ ] **Step 3:** Tests pass + commit

---

### Task 3: Jobs invites / acceptances / messages (DRY_RUN)

**Files:**
- Create: `grok-runner/src/jobs/invites.ts`, `acceptances.ts`, `messages.ts`, `discord.ts`, `linkedin/dry_run.ts`
- Test: `grok-runner/src/jobs/*.test.ts`

**Interfaces:**
- `POST /jobs/invites` `{ prospects }` → `{ ok, dry_run, results[] }`
- `POST /jobs/acceptances` idem
- `POST /jobs/messages/propose` → passe `message_a_valider` + digest Discord (si webhook)
- `POST /jobs/messages/send` `{ prospect_id, decision, text? }` → `message_envoye` si ok

- [ ] **Step 1:** Tests rouge jobs dry-run (match KO → alerting, propose → message_a_valider)
- [ ] **Step 2:** Implémentation minimale
- [ ] **Step 3:** Vert + commit

---

### Task 4: Twenty client + seed + statuses.md

**Files:**
- Create: `grok-runner/src/twenty_client.ts`, `twenty/statuses.md`, `twenty/seed-demo.json`
- Test: `grok-runner/src/twenty_client.test.ts`

- [ ] **Step 1:** Client HTTP Twenty avec fallback mock si `TWENTY_MODE=mock`
- [ ] **Step 2:** Seed 12 prospects démo
- [ ] **Step 3:** Commit

---

### Task 5: Workflows n8n JSON + import Make

**Files:**
- Create: `workflows/daily-outreach.json`, `weekly-acceptances.json`, `scripts/import-workflows.sh`

- [ ] **Step 1:** WF daily schedule 08:30 → HTTP grok-runner (smoke via webhook manuel aussi)
- [ ] **Step 2:** WF weekly Lun 08:15
- [ ] **Step 3:** `make import-workflows` documenté (docker cp + n8n import)
- [ ] **Step 4:** Commit

---

### Task 6: Prompts + runbook + dry-run-smoke E2E

**Files:**
- Create: `prompts/*.md`, `docs/runbook.md`
- Modify: `Makefile` (`dry-run-smoke`)

- [ ] **Step 1:** Prompts invite / acceptance / message
- [ ] **Step 2:** `make dry-run-smoke` curl jobs contre runner + seed
- [ ] **Step 3:** Vérifier sortie ; commit ; créer repo GitHub + push

---

## Execution

Inline dans cette session (demande Julien : « lance le développement »).
