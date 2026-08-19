# Runbook — DRY_RUN → LIVE

## Principles

- Default `DRY_RUN=true`: the runner plans actions and updates the mock / Twenty store **without** opening LinkedIn.
- LIVE carries LinkedIn ToS risk (browser automation). Prefer a dedicated account if you enable it.

## Going LIVE

1. Implement / wire `grok-runner/src/linkedin/live_browser.ts` (Grok computer use).
2. Set `GROK_API_KEY` and the LinkedIn session **outside git**.
3. Set `DRY_RUN=false` in `.env`.
4. Test on **1** prospect with a low cap (`MAX_INVITES_PER_DAY=1`).
5. Watch Discord (alerts).

## Twenty HTTP

`TWENTY_MODE=http` + `TWENTY_API_URL` + `TWENTY_API_KEY`.  
Fine-grained Twenty field mapping is still a v0 stub — wire your custom fields before production use.

## Incidents

- `alerting_profil_non_trouve` → fix the LinkedIn URL / Twenty record manually.
- LinkedIn ban / challenge → set `DRY_RUN=true` again and stop n8n schedules.
