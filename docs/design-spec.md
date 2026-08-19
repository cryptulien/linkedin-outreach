# Design — Shareable local LinkedIn outreach automation (sector-agnostic)

- **Date:** 2026-08-19  
- **Status:** Design validated + Excalidraw adversarial review 2026-08-19 — v0 implemented  
- **Product rules:** 10 invites/day, human-validated DMs, Twenty CRM, Discord alerting — **sector-agnostic**  
- **Repo:** [`cryptulien/linkedin-outreach`](https://github.com/cryptulien/linkedin-outreach)

---

## 1. Goal

Deliver a **small clonable local project** that:

1. **Runs** locally via Docker (`n8n` + `grok-runner`)
2. **Shares cleanly** (5-minute README, `.env.example`, versioned workflows, no secrets in git)
3. Implements the validated flow: auto invites → weekly acceptances → DM proposal → human validation → DM send → Twenty updates → Discord alerts

**Default on clone: `DRY_RUN=true`** — no real LinkedIn actions until LIVE is explicitly enabled.

---

## 2. Product decisions

| Decision | Choice |
|----------|--------|
| Shape | n8n + `grok-runner` service (not “all in n8n”, not Unipile) |
| Location | Dedicated Git repo |
| Grok trigger | **Automatic** (n8n → HTTP `grok-runner` → host `grok -p` OAuth / LinkedIn browser) |
| Dry-run | `DRY_RUN=true` by default |
| Invitation note | **None** — connection request only |
| Messages | **DM only** after connection, ≥ 3 days, mandatory human validation |
| Twenty | **External by default** (URL + API key); optional Compose profile `with-twenty` for local demo |

LinkedIn ToS risk from browser automation is **accepted**; dry-run and anti-bot caps limit exposure in v0.

---

## 3. Architecture

```
docker compose
  n8n (schedules)  --POST /jobs/*-->  grok-runner (DRY_RUN | LIVE)
       |                                    |
       +-------- HTTP --------> Twenty (external or local profile)
       |
       +-------- Discord webhook (alerts + validation digests)
```

### 3.1 Services

| Service | Role | Always? |
|---------|------|---------|
| `n8n` | Crons 08:30 / Mon 08:15, orchestration, Discord webhooks | Yes |
| `grok-runner` | Runs LinkedIn jobs (or simulates them in DRY_RUN) | Yes |
| `twenty` | Local demo CRM | No — profile `with-twenty` |

### 3.2 Repo layout

```
linkedin-outreach/
├── README.md
├── .env.example
├── docker-compose.yml
├── Makefile
├── workflows/
│   ├── daily-outreach.json
│   └── weekly-acceptances.json
├── grok-runner/          # Node 20 + TypeScript
├── prompts/
├── twenty/
│   ├── statuses.md
│   └── seed-demo.json
└── docs/
    ├── design-spec.md
    ├── runbook.md
    └── implementation-plan.md
```

---

## 4. Twenty statuses (contract)

| Status | Meaning |
|--------|---------|
| `non_invite` | Initial FIFO pool |
| `invite_envoye` | Invitation sent (+ send date) |
| `en_relation` | Invitation accepted (+ acceptance date) |
| `message_a_valider` | Accepted ≥ 3 days, DM draft awaiting human |
| `message_envoye` | DM validated and sent (+ date + content) |
| `alerting_profil_non_trouve` | LinkedIn profile not identifiable |
| `alerting_autre` | Other blocking error |

Processing order: **strict FIFO**.

Minimum prospect fields: first name, last name, title, organization, LinkedIn URL (if known), status, related dates, last DM content (if sent).

---

## 5. Detailed flows

### 5.1 Daily — 08:30 Europe/Paris

**Step A — Invitations (max 10)**

1. n8n reads 10 `non_invite` prospects (FIFO) from Twenty  
2. n8n `POST grok-runner/jobs/invites`  
3. For each prospect, `grok-runner`:  
   - opens LinkedIn profile  
   - verifies Name + Title + Organization  
   - **Match OK** → send invitation **with no note** → `invite_envoye` + date  
   - **Match KO** → search Name + Organization  
     - found → invite on the new profile  
     - not found → `alerting_profil_non_trouve` + Discord  
4. Random delays; Twenty updated as you go  

**Step B — DM proposal (same run, after A)**

1. Read `en_relation` with acceptance date ≥ 3 days and no sent DM  
2. `POST /jobs/messages/propose`  
3. Generate message → Twenty `message_a_valider` + store draft  
4. Publish digest on **Discord** (v0 validation + alerting); optional copy to Grok Bot  
5. **Nothing is sent** without validation (`ok` / `skip` / `modifier: …`)  
6. On `ok`: `POST /jobs/messages/send` → LinkedIn DM → `message_envoye`  

### 5.2 Weekly — Monday 08:15

1. Read all `invite_envoye`  
2. Batch 15–20 + random pauses  
3. If accepted → `en_relation` + acceptance date  
4. Else → stay `invite_envoye`  

### 5.3 Discord alerting

Any `alerting_*` transition:

1. Update Twenty  
2. Discord message: name, Twenty data, reason, optional link  

---

## 6. `grok-runner` API (v0 contract)

| Endpoint | Body | DRY_RUN | LIVE |
|----------|------|---------|------|
| `GET /healthz` | — | ok | ok |
| `POST /jobs/invites` | `{ prospects: [...] }` | JSON plan + log (+ Discord); no LinkedIn | Browser + invites + Twenty |
| `POST /jobs/acceptances` | `{ prospects: [...] }` | JSON plan | Browser + updates |
| `POST /jobs/messages/propose` | `{ prospects: [...] }` | Discord/log digest | Digest + wait for validation |
| `POST /jobs/messages/send` | `{ prospect_id, text, decision }` | Log “would send” | Send DM + Twenty |

Response shape: `{ ok, dry_run, results: [{ id, action, status, error? }] }`.

---

## 7. Configuration

### 7.1 Environment (see `.env.example`)

```bash
DRY_RUN=true
TIMEZONE=Europe/Paris
TWENTY_MODE=mock          # or http
TWENTY_API_URL=...
TWENTY_API_KEY=
DISCORD_WEBHOOK_URL=
OUTREACH_PRODUCT_BLURB=...
# LIVE: host `grok login` OAuth — never GROK_API_KEY / XAI_API_KEY
```

### 7.2 Anti-bot caps

- Max 10 invitations / day  
- Acceptance checks: 1 batch / week  
- DMs: never without human validation  
- Random delays between LinkedIn actions  

---

## 8. v0 acceptance criteria

1. `docker compose up` starts healthy `n8n` + `grok-runner`  
2. With `DRY_RUN=true` and mock/seed Twenty: `make dry-run-smoke` produces a visible action plan **without** LinkedIn I/O  
3. n8n workflows importable via `make import-workflows`  
4. Status mapping documented in `twenty/statuses.md`  
5. README enables a third party to get a dry-run in ≤ 5 minutes  
6. No secrets in the repository  

**Explicitly out of v0:** final DM copy, validation UI beyond Discord/Grok, Unipile / official LinkedIn API, WhatsApp.

---

## 9. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| LinkedIn ToS / account ban | DRY_RUN default; caps; delays; LIVE runbook; no invite note |
| Secret leakage when sharing | `.env` gitignored; `.env.example` only |
| Polluting prod Twenty in tests | mock mode + demo seed; README stresses DRY_RUN |
| Unstable Grok computer use | Dry-run without Grok; LIVE = host `grok -p` + OAuth only; refuse API keys |

---

## 10. Excalidraw ↔ spec adversarial review (2026-08-19)

Main intentional delta: Discord is **alerting + DM validation** in the shareable project (draw originally said alerting-only; Grok Bot digest). `message_a_valider` is set on propose. Templates = DM only (no invite note).

---

## References

- n8n workflow import patterns (HTTP Request nodes, cron triggers)  
