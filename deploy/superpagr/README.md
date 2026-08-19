# SuperPagr deployment (DRY_RUN)

## Stack wiring

| Component | Where |
|-----------|--------|
| grok-runner | Docker `loh-grok-runner` on `n8n_n8n-net` + `twenty-net` |
| Twenty | `http://twenty-server:3000` (maps kit status ↔ `Person.prospectionStage`) |
| n8n | Prod container `n8n` — workflows `loDailyOutreach01`, `loWeeklyAccept01` |
| Grok OAuth | Host `~/.grok/auth.json` (LIVE only; unused while `DRY_RUN=true`) |
| Discord | `DISCORD_WEBHOOK_URL` from `/root/.config/superpagr/notify.env` |

## Status mapping

| Kit | Twenty `prospectionStage` |
|-----|---------------------------|
| `non_invite` | `A_CONTACTER` |
| `invite_envoye` | `INVITATION_ENVOYEE` |
| `en_relation` | `CONNEXION_ACCEPTEE` |
| `message_a_valider` | `CONTACTE` |
| `message_envoye` | `MAIL_ENVOYE` |
| `alerting_*` | `PERDU` |

## Ops

```bash
# Restart runner
docker restart loh-grok-runner

# Health
docker exec n8n wget -qO- http://loh-grok-runner:8090/healthz

# Secrets live in /root/linkedin-outreach/.env (chmod 600, gitignored)
```

## LIVE later

1. `DRY_RUN=false` in `.env` / container env  
2. Recreate container with same networks  
3. Ensure host has `grok login` OAuth (no API key)  
4. Prefer running LIVE jobs from host for computer-use, or mount display — see `docs/runbook.md`
