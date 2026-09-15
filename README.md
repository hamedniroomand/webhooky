# Webhooky

A temporary webhook inbox with a live request inspector.

Open the app to get a webhook URL. Send requests to that URL, then inspect their headers, query parameters, body, and raw HTTP representation. No account is required.

## Run locally

Install Bun, then run:

```sh
bun install
bun run dev
```

Open `http://localhost:3000`. The first visit creates an inbox linked to your browser session.

1. Copy the webhook URL from the endpoint panel.
2. Send a request from your service or use the sample command in the app.
3. Select a request in the feed to inspect it.

Example (replace `YOUR_TOKEN` with the token shown in the app):

```sh
curl -X POST 'http://localhost:3000/h/YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"event":"hello","message":"It works!"}'
```

A local URL is reachable from your computer. External webhook senders need a public deployment or an HTTPS tunnel. Set `PUBLIC_BASE_URL` to that public origin.

## Features

- Live request feed through Server-Sent Events.
- Capture `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`, including nested paths.
- Inspect request metadata, headers, repeated query parameters, body, and raw text.
- View JSON, forms, XML, and plain text. HTML payloads render as text.
- Copy the endpoint, sample command, or raw request.
- Clear requests, create an inbox, or delete an inbox.
- Responsive layout with light and dark themes.

## Configuration

Bun reads `.env` automatically.

| Variable           | Default                 | Purpose                                                                               |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------------- |
| `PORT`             | `3000`                  | HTTP server port.                                                                     |
| `PUBLIC_BASE_URL`  | `http://localhost:3000` | Origin used in generated webhook URLs. Set this when the port or public host changes. |
| `WEBHOOKY_DB_PATH` | `data/webhooky.sqlite`  | SQLite database file.                                                                 |
| `NODE_ENV`         | Development when unset  | `production` disables development features and adds `Secure` to the session cookie.   |

## Production

```sh
PUBLIC_BASE_URL=https://hooks.example.com bun run start
```

Use HTTPS at the reverse proxy. Forward `/h/*`, `/api/*`, and the app to the same Bun process. Disable proxy buffering for `/api/inbox/:token/events`. Keep the database directory on persistent storage.

Run one application instance. Event subscriptions and rate limits are held in process memory. Multiple instances need shared event delivery and rate limiting.

`bun run build` creates browser assets in `dist/`. It does not create a standalone backend. `bun run start` serves the app and API from source through Bun.

## Inbox lifecycle and limits

| Item                | Limit or behavior                                                      |
| ------------------- | ---------------------------------------------------------------------- |
| Inbox lifetime      | 24 hours from creation.                                                |
| Stored requests     | Latest 100 per inbox. Older requests are removed.                      |
| Stored body         | Up to 1 MiB. Larger bodies retain metadata and return a payload error. |
| Server body limit   | 2 MiB. Bun can reject larger requests before capture.                  |
| Capture rate        | 120 requests per minute per token.                                     |
| Inbox creation rate | 10 per minute per session.                                             |
| Session cookie      | Seven days.                                                            |
| Expiry cleanup      | On access and every five minutes.                                      |

Refresh keeps the current inbox while the session is valid. Creating a new inbox changes the active inbox. The previous URL accepts requests until expiry, but the interface does not provide inbox history. Clearing browser data can remove access to an inbox.

## Access and data

The webhook URL permits request submission. It does not permit reading or deleting captured requests. Management endpoints require the owning browser session through an HttpOnly, SameSite cookie.

The app does not record the network client IP and strips common proxy IP headers. Senders can still include identifying data in other headers or payloads. Payloads are stored in SQLite until expiry or deletion. Use test data and protect the database file.

## Checks

```sh
bun test
bunx tsc --noEmit
bun run lint
bun run format:check
bun run build
```

Tests use an in-memory database. They cover request capture, session ownership, retention, routing, payload formatting, and unsafe HTML rendering.

## Project structure

```text
src/components/   App layout and request inspector
src/hooks/        Session, request feed, and theme state
src/lib/          Client API and payload formatting
src/server/       Bun routes, sessions, SQLite store, and event delivery
src/types/        Shared API response types
styles/           Theme tokens and Tailwind setup
tests/            Bun tests
```

The app uses React, Tailwind CSS, Radix UI primitives, and Lucide icons. Bun serves HTML imports and the API. SQLite uses WAL mode and foreign keys. No separate frontend development server is required.
