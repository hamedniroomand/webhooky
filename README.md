# Webhook Inspector Lite

Webhook Inspector Lite gives each browser a temporary public webhook URL, captures incoming HTTP requests, and shows them in a live inspector. Captured payloads stay readable only from the browser that owns the inbox.

This tool is for debugging webhooks. Do not send production secrets to temporary inboxes.

## Run

```bash
bun install
bun run dev
```

Open the URL printed by the server (default `http://localhost:3000`).

## Test

```bash
bun test
bunx tsc --noEmit
bun run build
```

## Architecture

- One Bun process serves three URL namespaces:
  - `/h/:token` public capture (no HTML, no session cookie)
  - `/api/*` management API and SSE (session cookie required)
  - `/*` React SPA
- Data is stored in `bun:sqlite` at `data/webhooky.sqlite` (WAL, foreign keys).
- Realtime updates use Server-Sent Events.
- Management auth uses an HttpOnly cookie and a server-side session row. Public webhook tokens never authorize management actions.

See `docs/superpowers/plans/2026-09-15-webhook-inspector-lite.md` for implementation decisions.

## Anonymous inbox lifecycle

- First visit creates a session cookie and an inbox when none exists.
- Refresh reuses the same inbox while the session cookie remains valid.
- Inboxes expire after 24 hours and are deleted on read or by the sweeper.
- `New Inbox` creates another inbox while the previous token keeps working until expiry.

## Limits

- 100 stored requests per inbox (oldest dropped)
- 1 MB request body limit (oversized requests store metadata only)
- Rate limits on capture, inbox creation, and management traffic

## Privacy

- Client IP addresses are not stored.
- Payload retention copy is shown in the UI.
- No analytics SDK ships in this MVP.

## Public vs management access

- Anyone with the webhook URL can **send** requests.
- Only the browser with the session cookie can **read**, **clear**, or **delete** captured requests.
