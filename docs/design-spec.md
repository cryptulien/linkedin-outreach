# Design — Projet local partageable : automatisation LinkedIn outreach (généraliste)

- **Date** : 19/08/2026
- **Statut** : design validé + revue adverse schéma Excalidraw 19/08/2026 — implémenté v0
- **Schéma Excalidraw** : zone outreach LinkedIn v1.0 sur draw.superpagr.com (cas d’usage initial : décideurs hospitaliers SuperPagr)
- **Spec métier** : outreach 10 invites/jour, DM avec validation humaine, Twenty CRM, Discord alerting — **sector-agnostic**
- **Repo** : `cryptulien/linkedin-outreach` (ex. `linkedin-outreach-hospitaliers`, renommé)

---

## 1. Objectif

Livrer un **petit projet local clonable** qui :

1. **Tourne** en local via Docker (`n8n` + `grok-runner`)
2. **Se partage** (README 5 minutes, `.env.example`, workflows versionnés, zéro secret dans git)
3. Implémente le flow validé : invitations automatiques → acceptations hebdo → proposition DM → validation humaine → envoi DM → mise à jour Twenty → alertes Discord

**Mode par défaut au clone : `DRY_RUN=true`** — aucune action LinkedIn réelle tant que le flag LIVE n’est pas activé explicitement.

---

## 2. Décisions produit (brainstorming)

| Décision | Choix |
|----------|--------|
| Forme | n8n + service `grok-runner` (pas « tout dans n8n », pas Unipile) |
| Emplacement | Repo Git dédié, hors monorepo SuperPagr |
| Déclenchement Grok | **Automatique** (n8n → HTTP `grok-runner` → computer use / browser LinkedIn) |
| Dry-run | `DRY_RUN=true` par défaut |
| Note d’invitation | **Aucune** — invitation LinkedIn seule |
| Messages | **DM uniquement** après relation, ≥ 3 jours, validation humaine obligatoire |
| Twenty | **Externe par défaut** (URL + clé API) ; profil Compose optionnel `with-twenty` pour un Twenty local de démo |

**Unipile** (API LinkedIn tierce payante) est hors scope. Le risque ToS LinkedIn du pilotage navigateur est **assumé** ; le dry-run et les caps anti-bot le limitent en v0.

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ docker compose                                              │
│                                                             │
│  ┌──────────┐    POST /jobs/*     ┌──────────────────────┐ │
│  │   n8n    │ ──────────────────► │    grok-runner       │ │
│  │ schedules│ ◄────────────────── │  DRY_RUN | LIVE      │ │
│  │ + Discord│    résultat JSON    │  prompts + browser   │ │
│  └────┬─────┘                     └──────────┬───────────┘ │
│       │                                      │             │
│       │ HTTP                                 │ HTTP        │
│       ▼                                      ▼             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Twenty (externe crm.superpagr.com OU profile local) │   │
│  └─────────────────────────────────────────────────────┘   │
│       │                                                    │
│       ▼                                                    │
│  Discord webhook (alerting + digests dry-run / propositions)│
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Services

| Service | Rôle | Toujours ? |
|---------|------|------------|
| `n8n` | Crons 08:30 / Lun 08:15, orchestration, webhooks Discord | Oui |
| `grok-runner` | Exécute les jobs LinkedIn (ou les simule en DRY_RUN) | Oui |
| `twenty` | CRM local de démo | Non — profile `with-twenty` |

### 3.2 Structure du repo

```
linkedin-outreach/
├── README.md
├── .env.example
├── docker-compose.yml
├── Makefile                 # up, down, import-workflows, dry-run-smoke
├── workflows/               # JSON n8n versionnés
│   ├── daily-outreach.json      # 08:30 — étape A puis B
│   ├── weekly-acceptances.json  # Lun 08:15
│   └── discord-alert.json       # sous-workflow / webhook alerting
├── grok-runner/
│   ├── Dockerfile
│   ├── package.json             # Node 20 + TypeScript (choix v0)
│   ├── src/
│   │   ├── server.ts            # HTTP API
│   │   ├── twenty_client.ts
│   │   ├── jobs/
│   │   │   ├── invites.ts
│   │   │   ├── acceptances.ts
│   │   │   └── messages.ts
│   │   └── linkedin/
│   │       ├── dry_run.ts
│   │       └── live_browser.ts  # Grok computer use — LIVE only
│   └── prompts/                 # symlinks ou copie depuis ../prompts/
├── prompts/
│   ├── invite-batch.md
│   ├── acceptance-batch.md
│   └── message-propose.md
├── twenty/
│   ├── statuses.md              # mapping statuts + champs dates
│   └── seed-demo.json           # prospects fictifs si profile with-twenty
└── docs/
    └── runbook.md               # passage DRY_RUN → LIVE, caps, incident Discord
```

---

## 4. Statuts Twenty (contrat)

| Statut | Signification |
|--------|----------------|
| `non_invite` | Pool FIFO initial |
| `invite_envoye` | Invitation envoyée (+ date envoi) |
| `en_relation` | Invitation acceptée (+ date acceptation) |
| `message_a_valider` | Accepté ≥ 3 j, draft DM stocké en attente de validation humaine |
| `message_envoye` | DM validé et envoyé (+ date + contenu) |
| `alerting_profil_non_trouve` | Profil LinkedIn non identifiable |
| `alerting_autre` | Autre erreur bloquante |

Ordre de traitement : **FIFO strict** selon l’ordre de la liste Twenty.

Champs minimaux attendus sur un prospect : nom, prénom, poste, établissement, URL LinkedIn (si connue), statut, dates associées, contenu dernier DM (si envoyé).

---

## 5. Flux détaillés

### 5.1 Quotidien — 08:30 Europe/Paris

**Étape A — Invitations (max 10)**

1. n8n lit 10 prospects `non_invite` (FIFO) via API Twenty  
2. n8n `POST grok-runner/jobs/invites` avec le lot  
3. Pour chaque prospect, `grok-runner` :  
   - ouvre le profil LinkedIn  
   - vérifie Nom + Poste + Établissement  
   - **Match OK** → envoie l’invitation **sans note** → `invite_envoye` + date  
   - **Match KO** → recherche Nom + Établissement  
     - trouvé → invite sur le nouveau profil  
     - non trouvé → `alerting_profil_non_trouve` + Discord  
4. Délais aléatoires entre actions ; update Twenty au fil de l’eau  

**Étape B — Proposition DM (même run, après A)**

1. n8n lit `en_relation` avec date d’acceptation ≥ 3 jours et sans DM envoyé  
2. `POST grok-runner/jobs/messages/propose`  
3. Génération du message (template placeholder en v0) → statut Twenty `message_a_valider` + draft stocké  
4. Digest publié sur **Discord** (validation v0 + alerting) ; copie possible vers conversation Grok Bot  
5. **Rien n’est envoyé** sans validation (réponse Discord : `ok` / `skip` / `modifier : …`)  
6. Sur « ok » : `POST /jobs/messages/send` → envoi DM LinkedIn → `message_envoye` + date + contenu  

### 5.2 Hebdomadaire — Lundi 08:15

1. Lire tous les `invite_envoye`  
2. Batch 15–20 + pauses aléatoires  
3. Si acceptée → `en_relation` + date d’acceptation  
4. Sinon → rester `invite_envoye`  

### 5.3 Alerting Discord

Tout passage `alerting_*` :

1. Update Twenty  
2. Message Discord : nom, données Twenty, raison, lien éventuel  

---

## 6. API `grok-runner` (contrat v0)

| Endpoint | Corps | Comportement DRY_RUN | Comportement LIVE |
|----------|-------|----------------------|-------------------|
| `GET /healthz` | — | ok | ok |
| `POST /jobs/invites` | `{ prospects: [...] }` | Plan JSON + log + Discord ; pas de LinkedIn | Browser + invites + Twenty |
| `POST /jobs/acceptances` | `{ prospects: [...] }` | Plan JSON | Browser + updates |
| `POST /jobs/messages/propose` | `{ prospects: [...] }` | Digest Discord/log | Digest + attend validation |
| `POST /jobs/messages/send` | `{ prospect_id, text, decision }` | Log « aurait envoyé » | Envoi DM + Twenty |

Réponses : JSON structuré `{ ok, dry_run, results: [{ id, action, status, error? }] }` pour que n8n puisse brancher.

---

## 7. Configuration

### 7.1 Variables d’environnement (extrait `.env.example`)

```bash
DRY_RUN=true
TIMEZONE=Europe/Paris

# Twenty externe (défaut)
TWENTY_API_URL=https://crm.superpagr.com
TWENTY_API_KEY=

# Ou : docker compose --profile with-twenty up
# TWENTY_API_URL=http://twenty:3000

DISCORD_WEBHOOK_URL=

# LIVE uniquement — ne pas committer
GROK_API_KEY=
# + éventuels cookies / session LinkedIn gérés hors git (doc runbook)
```

### 7.2 Caps anti-bot (hardcodés + surchargeables)

- Max 10 invitations / jour  
- Vérif acceptations : 1 batch / semaine  
- DM : jamais sans validation humaine  
- Délais aléatoires entre actions LinkedIn  

---

## 8. Critères d’acceptation v0

1. `docker compose up` démarre `n8n` + `grok-runner` healthy  
2. Avec `DRY_RUN=true` et Twenty mocké ou seed local : le cron daily (ou `make dry-run-smoke`) produit un plan d’actions visible (logs + Discord test) **sans** interaction LinkedIn  
3. Workflows n8n importables via `make import-workflows` (ou équivalent documenté)  
4. Mapping statuts Twenty documenté dans `twenty/statuses.md`  
5. README permet à un tiers de cloner et obtenir un dry-run en ≤ 5 minutes  
6. Aucun secret dans le dépôt  

**Hors v0 explicite**

- Templates DM définitifs (placeholder acceptable)  
- UI de validation autre que Grok/Discord  
- Unipile / API LinkedIn officielle  
- WhatsApp  

---

## 9. Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| ToS LinkedIn / ban compte | DRY_RUN défaut ; caps ; délais ; runbook LIVE ; pas de note d’invite |
| Fuite secrets au partage | `.env` gitignored ; `.env.example` seul |
| Twenty prod pollué en test | Profil `with-twenty` + seed démo ; README insiste sur DRY_RUN |
| Computer use Grok instable | Contrat API stable ; dry-run testable sans Grok ; LIVE isolé dans `live_browser` |

---

## 10. Revue adverse schéma Excalidraw ↔ spec (19/08/2026)

Contrôle contre le board vertical (après aération Julien). Invite sans note confirmée sur le draw (`A3a … sans note d'invitation`).

| Point | Draw | Spec | Verdict |
|-------|------|------|---------|
| Outils n8n / Twenty / Grok / Discord / Humain | Légende + matrice | Architecture §3 | Aligné |
| États Twenty + FIFO | Machine à états | §4 | Aligné |
| Daily 08:30 A puis B | Flow vertical | §5.1 | Aligné |
| Match → recherche alt. → alerting | Losanges A | §5.1 | Aligné |
| Invite **sans** note | A3a mis à jour | §2 / §5.1 | Aligné |
| Hebdo Lun 08:15 batch 15–20 | Flow hebdo | §5.2 | Aligné |
| Caps anti-bot | Boîte sécurité | §7.2 | Aligné |
| **Canal validation DM** | B3 = digest **Grok Bot** ; Discord = « alerting uniquement » | Discord = canal validation v0 + alerting | **Écart volontaire** (projet partageable sans session Grok) — draw à mettre à jour : Discord = alerting **et** validation DM v0 ; digest aussi poussé vers Grok si dispo |
| Statut `message_a_valider` | Présent machine à états ; pas explicite dans cases B | §4 + §5.1 | **À durcir** : B2/propose pose `message_a_valider` avant attente humain |
| Footer templates | « note d'invitation + message DM » | Note invite abandonnée | **Draw périmé** — templates = DM seulement |

**Conclusion revue :** aucun bloqueur. Écarts documentés ; implémentation v0 suit la spec (Discord validation + `message_a_valider` explicite). Sync draw en follow-up cosmétique.

### 10.1 Durcissement post-revue (normatif)

1. `POST /jobs/messages/propose` → écrit le draft et passe le prospect en `message_a_valider`  
2. Discord reçoit le digest de validation **et** les alertes `alerting_*`  
3. Templates = **message DM uniquement** (pas de note d’invitation)

---

## 11. Prochaines étapes

1. ~~Revue spec Julien~~ + revue adverse schéma  
2. Plan d’implémentation + scaffold repo  
3. Dry-run smoke (`docker compose up` + `make dry-run-smoke`)  
4. Workflows n8n importables  
5. Branchement Twenty externe en dry-run  
6. Activation LIVE documentée (hors chemin par défaut)  
7. Follow-up : aligner libellés Discord / templates sur le draw  

---

## Références

- Schéma Excalidraw v1.0 vertical (draw.superpagr.com, snapshot `linkedin-automation-v1-vertical`)  
- Spec métier outreach 19/08/2026 (états, flows, règles)  
- Spec CRM-AUTO 29/07/2026 (`2026-07-29-crm-auto-connecteurs-linkedin-whatsapp-spec.md`) — contexte ToS ; **non suivie** pour le choix browser/Grok (arbitrage explicite du 19/08)  
- Skill n8n SuperPagr (`n8n.superpagr.com`) — patterns import workflow / HTTP Request  
