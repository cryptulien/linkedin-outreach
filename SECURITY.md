# Security Policy

## Supported versions

Only the `main` branch is supported.

## Reporting a vulnerability

Please report security issues **privately** to the repository owner (GitHub
Security Advisories preferred, or a private message). Do not open a public issue
for:

- leaked tokens, webhooks, or `~/.grok/auth.json` contents
- remote code execution or dependency exploits
- ways to bypass DRY_RUN safeguards

## Project-specific expectations

- Contributors must not commit `.env` files or OAuth credentials.
- LIVE LinkedIn automation carries account risk; do not use this project to
  harass people or evade platform rate limits.
- Grok LIVE path must use **OAuth subscription sessions**, not shared API keys
  checked into git.
