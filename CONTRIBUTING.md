# Contributing

Thanks for helping improve this LinkedIn outreach automation kit.

## Ground rules

1. **Never commit secrets** — `.env`, `~/.grok/auth.json`, Twenty API keys, Discord webhooks, LinkedIn sessions.
2. **Default is `DRY_RUN=true`** — PRs must not require LIVE LinkedIn access to be testable.
3. **No API-key Grok auth in docs or scripts** — LIVE uses OAuth (`grok login` / `--device-auth`) against a subscription session.
4. Keep the project **sector-agnostic** (no product-specific branding in core docs).
5. Prefer small PRs with a clear problem statement and how you tested (`make test`, `make dry-run-smoke`).

## Local setup

```bash
git clone https://github.com/cryptulien/linkedin-outreach.git
cd linkedin-outreach
cp .env.example .env
make up
make test
make dry-run-smoke
```

## Pull requests

- Describe the change and the test commands you ran.
- Update README / `docs/` when behavior or contracts change.
- Do not add tracking, phone-home, or undisclosed remote calls.

## Security issues

See [SECURITY.md](./SECURITY.md) — do not open public issues for credential leaks or LIVE abuse reports.
