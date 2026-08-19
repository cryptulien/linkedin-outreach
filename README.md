# LinkedIn Outreach

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Shareable, **sector-agnostic** open-source automation: LinkedIn invitations (daily cap), weekly acceptance checks, DM proposals with **mandatory human validation**, Twenty CRM, Discord alerts.

Any vertical works — healthcare, B2B SaaS, agencies, nonprofits. Point it at your CRM and templates.

Orchestration: **n8n** · execution: **grok-runner** · default mode: **`DRY_RUN=true`** (no real LinkedIn actions).

## Get started in 5 minutes

```bash
git clone https://github.com/cryptulien/linkedin-outreach.git
cd linkedin-outreach
cp .env.example .env
make up
make dry-run-smoke
```

- Runner: http://127.0.0.1:8090/healthz  
- n8n: http://127.0.0.1:5679  

## Twenty modes

| `TWENTY_MODE` | Behavior |
|---------------|----------|
| `mock` (default) | File-backed store + `twenty/seed-demo.json` (multi-sector demo prospects) |
| `http` | Real Twenty API (`TWENTY_API_URL` + `TWENTY_API_KEY`) |

## Caps (overridable via `.env`)

- 10 invitations / day (`MAX_INVITES_PER_DAY`)  
- Acceptances: 1 batch / week (Mon 08:15)  
- Invitation **with no note**  
- DMs: never without human validation (`ok` / `skip` / `modifier`)  

## Customization

- DM template blurb: `OUTREACH_PRODUCT_BLURB` in `.env`  
- Agent prompts: `prompts/*.md`  
- CRM statuses: `twenty/statuses.md`  

## LIVE mode (OAuth subscription, no API key)

LIVE runs **headless Grok** on the host (`grok -p`) using your OAuth session in `~/.grok/auth.json` (subscription). Do **not** set `GROK_API_KEY` / `XAI_API_KEY`.

```bash
grok login          # or: grok login --device-auth
# .env → DRY_RUN=false
make live-runner    # host process; see docs/runbook.md
```

Never commit `~/.grok/auth.json`. LinkedIn ToS risk still applies when LIVE drives the browser.

## Commands

```bash
make up                 # build + start (DRY_RUN in Docker)
make test               # vitest grok-runner
make dry-run-smoke      # invites → propose → send (dry)
make import-workflows   # import n8n JSON workflows
make live-runner        # host grok-runner for LIVE (OAuth)
make down
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [SECURITY.md](./SECURITY.md).

