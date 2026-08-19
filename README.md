# LinkedIn Outreach — Décideurs hospitaliers

Automatisation locale **partageable** : invitations LinkedIn (10/jour), vérif acceptations (hebdo), proposition DM avec **validation humaine**, CRM Twenty, alertes Discord.

Orchestration : **n8n** · exécution : **grok-runner** · mode défaut : **`DRY_RUN=true`** (aucune action LinkedIn réelle).

Spec : [superpagr-workspace — design 2026-08-19](https://github.com/cryptulien/superpagr-workspace/blob/main/docs/superpowers/specs/2026-08-19-linkedin-outreach-hospitaliers-design.md)

## Démarrage en 5 minutes

```bash
git clone <ce-repo>
cd linkedin-outreach-hospitaliers
cp .env.example .env
make up
make dry-run-smoke
```

- Runner : http://127.0.0.1:8090/healthz  
- n8n : http://127.0.0.1:5679  

## Modes Twenty

| `TWENTY_MODE` | Comportement |
|---------------|--------------|
| `mock` (défaut) | Store fichier / mémoire + `twenty/seed-demo.json` |
| `http` | API Twenty réelle (`TWENTY_API_URL` + `TWENTY_API_KEY`) |

## Caps

- 10 invitations / jour  
- Acceptations : 1 batch / semaine (Lun 08:15)  
- Invitation **sans note**  
- DM : jamais sans validation humaine (`ok` / `skip` / `modifier`)  

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
