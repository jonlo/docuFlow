## Context

FlowDocs has a Hono Worker backend and a React/Vite frontend. The D1 schema already defines an `events` table and a `users` table. Cloudflare KV (`FLOWDOCS_KV`) is available for session and token storage. No auth or calendar code exists yet — this change introduces the entire authentication layer and the first real data flow.

Google Calendar uses OAuth 2.0 with server-side token exchange. The client secret must never reach the browser, so all OAuth logic lives in the Worker.

## Goals / Non-Goals

**Goals:**
- Full server-side OAuth 2.0 flow (authorization URL → callback → token exchange → KV storage)
- Session cookie issued after successful auth, used by all subsequent API calls
- Sync the user's primary Google Calendar events into D1 on first authenticated load (and on manual refresh)
- `GET /api/events` endpoint returning events from D1
- Frontend `AuthGate` that detects auth state and drives the popup flow
- Frontend `CalendarView` rendering events with month/week/day switching

**Non-Goals:**
- Multi-calendar support (primary calendar only for now)
- Real-time push notifications / webhooks from Google
- Write-back to Google Calendar (create/edit/delete events)
- Confluence integration
- Tauri packaging

## Decisions

### 1. Token storage: KV only, no D1

OAuth tokens (`access_token`, `refresh_token`, `expiry`) are stored under `oauth:{user_id}` in KV. Sessions are stored under `session:{uuid}`. D1 stores the `users` row (google_id, email, name) but never the token material.

**Why**: Tokens are ephemeral secrets with TTLs — KV's key-expiry and fast reads fit better than D1 rows. Keeping secrets out of the relational store limits blast radius if D1 is ever exported or queried by tooling.

**Alternative considered**: Store tokens in D1 encrypted. Rejected — adds encryption complexity with no meaningful benefit given KV already exists.

### 2. Popup-based OAuth, polling for completion

The frontend opens `window.open()` with the consent URL. A `useAuthStatus` hook polls `GET /api/auth/status` every 2 seconds. When the Worker detects a valid session cookie on that endpoint, the hook resolves and the popup is closed.

**Why**: Avoids redirect complexity in a SPA. The Worker handles the callback entirely; the frontend just waits. This matches the architecture described in CLAUDE.md.

**Alternative considered**: postMessage from popup. Rejected — requires the callback page to be a frontend route, coupling the Worker redirect URI to the SPA.

### 3. Event sync strategy: pull-on-load, store in D1

On `GET /api/events`, the Worker calls the Google Calendar API with the user's access token, upserts results into D1 `events` (keyed on `google_event_id`), then returns from D1. Token refresh is handled transparently before the Google API call.

**Why**: D1 as the read source decouples the frontend from Google API latency and rate limits. Upsert on `google_event_id` is idempotent — safe to call repeatedly.

**Alternative considered**: Proxy directly to Google on every request (no D1 write). Rejected — every page load would hit Google's API, coupling availability and adding latency; also makes future offline/task-linking features impossible.

### 4. Google domain module structure (lightweight hexagonal)

All Google-related code is grouped under a `google/` domain in each package. Within that domain, concerns are layered — thin route handlers delegate to logic modules, which delegate to infrastructure modules. Nothing in the logic layer imports directly from the route or infra layers of other domains.

```
packages/api/src/google/
  routes.ts      # Thin Hono route handlers — delegate only, no logic
  auth.ts        # OAuth logic: session creation, state validation
  calendar.ts    # Event sync logic: fetch, map, upsert
  tokens.ts      # Token refresh: check expiry, call Google, update KV
  kv.ts          # All KV reads/writes (sessions, tokens)
  api.ts         # Raw HTTP calls to Google APIs (token exchange, calendar list)
  types.ts       # Google API response shapes (raw, not shared)

packages/web/src/google/
  AuthGate.tsx
  CalendarView.tsx
  hooks.ts       # useAuthStatus, useCalendarEvents

packages/shared/src/google/
  index.ts       # CalendarEvent, AuthStatus — shared domain types
```

**Why**: Keeps infra (KV, raw Google HTTP) swappable without touching business logic. Avoids scattering Google-specific code across the codebase. Lightweight enough — no ports/adapters ceremony, just disciplined import direction.

**Rule**: `routes.ts` imports from `auth.ts`/`calendar.ts` only. `auth.ts`/`calendar.ts` import from `kv.ts`/`api.ts`/`tokens.ts`. Nothing imports from `routes.ts`.

### 5. react-big-calendar for the calendar UI

Use `react-big-calendar` (with `date-fns` localizer) for the `CalendarView` component.

**Why**: Mature, well-typed, supports month/week/day/agenda views out of the box. Matches the CLAUDE.md "build order" which explicitly names this library.

## Risks / Trade-offs

- **`INSERT OR REPLACE` breaks foreign keys** → Use `INSERT INTO ... ON CONFLICT(google_event_id) DO UPDATE SET ...` instead. `INSERT OR REPLACE` deletes and re-inserts the row, changing the D1 primary key and cascade-deleting any tasks linked via `event_id`.
- **`GET /api/events` has write side effects** → Acknowledged trade-off for simplicity. Mitigated by a 5-minute `synced_at` guard in KV so repeated loads don't hammer Google. A future `POST /api/events/sync` should replace this when sync timing needs more control.
- **Access token expiry during sync** → Check `expiry` before the Google API call; use `tokens.ts` to refresh transparently. Fail with 401 if refresh also fails, which triggers re-auth in the frontend.
- **CSRF state token longevity** → Store OAuth `state` in KV with a 5-minute TTL and delete on first use. Without a TTL, a leaked state value stays valid indefinitely.
- **KV eventual consistency** → Session writes happen in the callback handler before the redirect/response; the polling interval (2s) provides sufficient time for propagation.
- **Popup blockers** → Trigger `window.open` only from a direct user click (the "Connect Google Calendar" button), which browsers allow.
- **Google outage / 429 visible to users** → `CalendarView` MUST render an inline error state with a retry button rather than a blank calendar. A 401 from `/api/events` MUST trigger re-auth flow in `AuthGate`.

## Migration Plan

1. Deploy Worker with new routes and KV/D1 bindings in place
2. Set Worker secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`
3. Add authorized redirect URI in Google Cloud Console (`https://<worker>.workers.dev/api/auth/google/callback`)
4. Deploy frontend with `AuthGate` and `CalendarView`
5. Rollback: remove new routes from Worker — no D1 schema changes required beyond what already exists

## Open Questions

- Should the event sync window be configurable per user, or fixed (e.g., ±30 days)?
- Do we show a loading skeleton in `CalendarView` while events are being fetched, or block render behind `AuthGate`?
