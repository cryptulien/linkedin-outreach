# Runbook — DRY_RUN → LIVE

## Principes

- Par défaut `DRY_RUN=true` : le runner planifie et met à jour le store mock / Twenty, **sans** ouvrir LinkedIn.
- LIVE implique un risque ToS LinkedIn (pilotage navigateur). Activer uniquement sur un compte dédié si possible.

## Passage LIVE

1. Implémenter / brancher `grok-runner/src/linkedin/live_browser.ts` (Grok computer use).
2. Renseigner `GROK_API_KEY` et la session LinkedIn **hors git**.
3. Mettre `DRY_RUN=false` dans `.env`.
4. Tester sur **1** prospect, caps bas (`MAX_INVITES_PER_DAY=1`).
5. Surveiller Discord (alertes).

## Twenty HTTP

`TWENTY_MODE=http` + `TWENTY_API_URL` + `TWENTY_API_KEY`.  
Le client HTTP d’écriture fine est un stub en v0 : brancher le mapping champs Twenty custom avant prod.

## Incident

- Alerte `alerting_profil_non_trouve` → corriger l’URL / fiche Twenty manuellement.
- Ban / challenge LinkedIn → remettre `DRY_RUN=true`, stopper les crons n8n.
