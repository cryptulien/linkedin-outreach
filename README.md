# LinkedIn Outreach

Automatisation locale **partageable et généraliste** : invitations LinkedIn (cap journalier), vérification des acceptations (hebdo), proposition de DM avec **validation humaine**, CRM Twenty, alertes Discord.

Aucun secteur imposé : hôpital, SaaS B2B, cabinet, association… tu branches ton CRM et tes templates.

Orchestration : **n8n** · exécution : **grok-runner** · mode défaut : **`DRY_RUN=true`** (aucune action LinkedIn réelle).

## Démarrage en 5 minutes

```bash
git clone https://github.com/cryptulien/linkedin-outreach.git
cd linkedin-outreach
cp .env.example .env
make up
make dry-run-smoke
```

- Runner : http://127.0.0.1:8090/healthz  
- n8n : http://127.0.0.1:5679  

## Modes Twenty

| `TWENTY_MODE` | Comportement |
|---------------|--------------|
| `mock` (défaut) | Store fichier + `twenty/seed-demo.json` (prospects fictifs multi-secteurs) |
| `http` | API Twenty réelle (`TWENTY_API_URL` + `TWENTY_API_KEY`) |

## Caps (surchargeables via `.env`)

- 10 invitations / jour (`MAX_INVITES_PER_DAY`)  
- Acceptations : 1 batch / semaine (Lun 08:15)  
- Invitation **sans note**  
- DM : jamais sans validation humaine (`ok` / `skip` / `modifier`)  

## Personnalisation

- Templates DM : `prompts/message-template.md` (ou génération via `defaultDmTemplate`)
- Prompts agent : `prompts/*.md`
- Statuts CRM : `twenty/statuses.md`

## LIVE (attention ToS LinkedIn)

Voir `docs/runbook.md`. Ne jamais committer cookies / `GROK_API_KEY`.

## Commandes

```bash
make up                 # build + start
make test               # vitest grok-runner
make dry-run-smoke      # enchaîne invites → propose → send (dry)
make import-workflows   # importe les JSON n8n
make down
```

## Contexte SuperPagr

Né pour la prospection SuperPagr, le repo est volontairement **sector-agnostic**. La spec d’origine (cas décideurs hospitaliers) reste dans le workspace SuperPagr pour l’historique produit.
