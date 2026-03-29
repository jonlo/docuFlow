## Why

FlowDocs is a productivity app centered on calendar events and tasks — without Google Calendar integration, the app has no real data to display or interact with. This change wires up the full OAuth 2.0 flow and surfaces synced events on a calendar view, making the app usable for the first time.

## What Changes

- Add backend OAuth 2.0 flow: generate consent URL, handle callback, exchange code for tokens, store tokens in KV, set session cookie
- Add backend endpoint to fetch and sync Google Calendar events into D1
- Add `GET /api/auth/google/url`, `GET /api/auth/google/callback`, `GET /api/auth/status` routes
- Add `GET /api/events` route returning synced calendar events
- Add frontend `AuthGate` component that drives the OAuth popup flow and polls for session
- Add frontend `CalendarView` component rendering events using react-big-calendar
- Store Google OAuth tokens in KV under `session:{uuid}` with 7-day TTL
- Sync Google Calendar events into D1 `events` table on authenticated load

## Capabilities

### New Capabilities

- `google-oauth`: OAuth 2.0 flow — generate consent URL, handle redirect callback, exchange code for tokens, store in KV, set session cookie, poll auth status
- `calendar-events-sync`: Fetch events from Google Calendar API and persist them into the D1 `events` table; serve them via `GET /api/events`
- `calendar-view`: Frontend calendar UI using react-big-calendar that displays synced events, with month/week/day views

### Modified Capabilities

## Impact

- **packages/api**: New routes (`/api/auth/google/*`, `/api/events`), new KV reads/writes, new D1 writes to `events` table; requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` Worker secrets and `FLOWDOCS_KV` binding
- **packages/web**: New `AuthGate.tsx` and `CalendarView.tsx` components; adds `react-big-calendar` dependency; reads `VITE_API_URL`
- **packages/shared**: New shared types for `CalendarEvent`, `AuthStatus`
- **External**: Google Cloud project must have Calendar API enabled and OAuth 2.0 credentials configured with the Worker callback URL as an authorized redirect URI
