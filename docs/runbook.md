# Runbook — DRY_RUN → LIVE (OAuth subscription)

## Principles

- Default `DRY_RUN=true`: the runner plans actions and updates the mock / Twenty store **without** opening LinkedIn or calling Grok.
- LIVE uses **headless Grok sessions** (`grok -p`) authenticated with **OAuth** so usage goes through your **Grok subscription**, not console API keys.
- **Never** set `GROK_API_KEY` / `XAI_API_KEY` for this project. **Never** commit `~/.grok/auth.json`.

## One-time OAuth on the host

```bash
# Machine with a browser:
grok login

# Headless / remote host:
grok login --device-auth
```

Credentials are stored in `~/.grok/auth.json` (mode `0600`). The runner refuses to start LIVE if an API key env var is present.

## Going LIVE

1. Stay on the **host** (not inside the Docker image for the runner): computer-use / browser need the desktop session where LinkedIn is usable.
2. Confirm OAuth: `test -f ~/.grok/auth.json`
3. Unset API keys: `unset GROK_API_KEY XAI_API_KEY`
4. In `.env`: `DRY_RUN=false`
5. Start the runner on the host:

```bash
cd grok-runner
PROMPTS_DIR=../prompts npm start
```

Or: `make live-runner`

6. Keep n8n (Compose) pointing at `http://host.docker.internal:8090` / `http://172.17.0.1:8090` if n8n stays in Docker — or run smoke curls against `http://127.0.0.1:8090`.
7. Test on **1** prospect (`MAX_INVITES_PER_DAY=1`).
8. Watch Discord alerts.

## What LIVE does

`grok-runner` shells out to:

```bash
grok -p "<prompt + prospect JSON>" --output-format json --max-turns N
```

Prompts live in `prompts/*.md`. Grok uses tools (including computer-use / browser when available) under your subscription session.

## Twenty HTTP

`TWENTY_MODE=http` + `TWENTY_API_URL` + `TWENTY_API_KEY` (Twenty CRM key — unrelated to Grok).

## Incidents

- `alerting_profil_non_trouve` → fix the LinkedIn URL / Twenty record manually.
- LinkedIn ban / challenge → set `DRY_RUN=true` again and stop n8n schedules.
- Grok auth errors → re-run `grok login` / `--device-auth`; do not fall back to an API key.
