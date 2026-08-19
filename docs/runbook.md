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
5. Prepare a **logged-in LinkedIn browser** on the same `DISPLAY` the runner uses (see [LIVE LinkedIn desktop](#live-linkedin-desktop-required) below). Without this, Grok returns `alert_profil_non_trouve` even when the CRM URL is correct.
6. Start the runner on the host:

```bash
cd grok-runner
PROMPTS_DIR=../prompts npm start
```

Or: `make live-runner`

7. Keep n8n (Compose) pointing at `http://host.docker.internal:8090` / `http://172.17.0.1:8090` if n8n stays in Docker — or run smoke curls against `http://127.0.0.1:8090`.
8. Test on **1** prospect (`MAX_INVITES_PER_DAY=1`).
9. Watch Discord alerts.

## LIVE LinkedIn desktop (required)

LIVE invites are driven by Grok **computer-use** on an X11 display (typically `DISPLAY=:99`). That display must show a Chromium (or Chrome) window already logged into LinkedIn.

### One-time human login

1. Start a virtual framebuffer if you do not have a physical desktop: `Xvfb :99 -screen 0 1280x2000x24`
2. Launch Chromium on that display with a **persistent** profile directory (so the session survives restarts).
3. Expose the display with **x11vnc** + **noVNC/websockify** (or any VNC client) so you can log in from your laptop.
4. Open LinkedIn in that browser and complete login / 2FA once.
5. Leave the browser running. Export `DISPLAY=:99` for the grok-runner process (systemd drop-in or shell).

Example (host packages; adjust paths):

```bash
export DISPLAY=:99
x11vnc -display :99 -rfbauth /path/to/vnc.pass -localhost -forever -shared -rfbport 5900
websockify --web=/usr/share/novnc/ 127.0.0.1:6080 127.0.0.1:5900
# Then tunnel or reverse-proxy to 127.0.0.1:6080 — never commit the VNC password.
```

### Reverse-proxy note (noVNC + SSO)

If you put noVNC behind a forward-auth SSO (Authelia, Authentik, …), **keep the WebSocket path** (`/websockify`) **out of** the forward-auth middleware. SSO often returns `401`/`302` on `Upgrade: websocket`, and noVNC then shows “Failed to connect to server” before you can enter the VNC password. Protect `/websockify` with the VNC RFB password (and optionally network controls). HTML pages can stay behind SSO.

Canonical noVNC URL shape:

`https://<your-host>/vnc.html?path=websockify&autoconnect=1&resize=scale`

There is **no VNC username/ID** with `x11vnc -rfbauth` — password only.

### Secrets hygiene

- Store VNC password files under a gitignored directory (this repo ignores `var/`, `*.pass`, `*.password.txt`).
- Do not commit browser profiles, LinkedIn cookies, or SSO credentials.

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
