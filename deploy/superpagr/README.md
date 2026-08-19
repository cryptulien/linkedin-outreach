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

## LIVE (host runner + LinkedIn desktop)

1. `DRY_RUN=false` in `/root/linkedin-outreach/.env` (gitignored)
2. Host systemd: `loh-grok-runner` with `DISPLAY=:99` and `GROK_HOME=/root/.grok`
3. LinkedIn Chromium + noVNC on `:99` (services `loh-linkedin-chrome` / `loh-linkedin-vnc` / `loh-linkedin-novnc`)
4. Human login once via noVNC (SSO then VNC password then LinkedIn) — see `docs/runbook.md` § LIVE LinkedIn desktop
5. Traefik dynamic example pattern: SSO on HTML, **no** forward-auth on `/websockify`
6. Never commit `var/vnc.password.txt`, browser profiles, or `.env`

Ops details for this host stay on the server only (not in the public kit tree).

## n8n → host runner

On this host the LIVE runner listens on the Docker bridge IP visible from `n8n`
(UFW allows that subnet → `:8090`). Workflow HTTP nodes use that host URL in the
**deployed** n8n instance only — the JSON templates in `workflows/` keep the
portable `http://loh-grok-runner:8090/...` placeholders for other installs.
