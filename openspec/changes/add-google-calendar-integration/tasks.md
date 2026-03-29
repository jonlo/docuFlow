## 1. Shared Types

- [x] 1.1 Create `packages/shared/src/google/index.ts` with `CalendarEvent` type (`id`, `googleEventId`, `title`, `start`, `end`, `description`)
- [x] 1.2 Add `AuthStatus` type to `packages/shared/src/google/index.ts` (`authenticated`, optional `user: { email, name }`)
- [x] 1.3 Re-export from `packages/shared/src/index.ts`

## 2. Backend — Infrastructure Layer

- [x] 2.1 Create `packages/api/src/google/types.ts`: raw Google API response shapes (`GoogleTokenResponse`, `GoogleUserInfo`, `GoogleCalendarEvent`)
- [x] 2.2 Create `packages/api/src/google/kv.ts`: typed helpers for all KV reads/writes — `getSession`, `setSession`, `deleteSession`, `getTokens`, `setTokens`, `deleteTokens`, `getSyncedAt`, `setSyncedAt`, `getOAuthState`, `setOAuthState` (5-min TTL), `deleteOAuthState`
- [x] 2.3 Create `packages/api/src/google/api.ts`: raw HTTP calls to Google — `exchangeCode`, `refreshAccessToken`, `getUserInfo`, `listCalendarEvents`

## 3. Backend — Logic Layer

- [x] 3.1 Create `packages/api/src/google/tokens.ts`: `ensureFreshToken(userId, kv)` — checks expiry, calls `api.refreshAccessToken` if needed, updates via `kv.setTokens`
- [x] 3.2 Create `packages/api/src/google/auth.ts`: `buildConsentUrl` (generates state, stores in KV with 5-min TTL), `handleCallback` (validates state, deletes state from KV, exchanges code, upserts user in D1, creates session), `getAuthStatus`
- [x] 3.3 Create `packages/api/src/google/calendar.ts`: `syncAndReturnEvents(userId, accessToken, db, kv)` — checks `synced_at` in KV, skips Google API call if within 5 minutes; otherwise calls `api.listCalendarEvents`, maps fields, upserts into D1 using `ON CONFLICT(google_event_id) DO UPDATE SET`, updates `synced_at`, returns `CalendarEvent[]`

## 4. Backend — Routes Layer

- [x] 4.1 Create `packages/api/src/google/routes.ts`: thin Hono route handlers for `GET /api/auth/google/url`, `GET /api/auth/google/callback`, `GET /api/auth/status`, `GET /api/events` — delegate to `auth.ts`/`calendar.ts`, no logic inline
- [x] 4.2 Add session middleware (in `routes.ts` or a shared middleware file): reads `session` cookie, resolves user from KV, attaches to Hono context
- [x] 4.3 Mount `google/routes.ts` in the main Hono app entry point

## 5. Backend — Wrangler Config

- [x] 5.1 Add `FLOWDOCS_KV` KV namespace binding to `wrangler.toml`
- [x] 5.2 Add `D1_DATABASE` binding for `flowdocs-db` to `wrangler.toml`
- [x] 5.3 Document required secrets (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`) in `packages/api/.dev.vars.example`

## 6. Frontend — Google Domain

- [x] 6.1 Add `react-big-calendar` and `date-fns` to `packages/web` dependencies
- [x] 6.2 Create `packages/web/src/google/hooks.ts`: `useAuthStatus` and `useCalendarEvents` TanStack Query hooks
- [x] 6.3 Create `packages/web/src/google/AuthGate.tsx`: checks auth status, shows loading indicator, renders "Connect Google Calendar" button or children
- [x] 6.4 Implement OAuth popup logic in `AuthGate`: fetch consent URL, open via `window.open`, poll every 2 seconds, close popup and invalidate query on success, stop polling if popup closed manually
- [x] 6.5 Create `packages/web/src/google/CalendarView.tsx`: `react-big-calendar` with `date-fns` localizer, maps `CalendarEvent[]` to big-calendar shape, month/week/day view switching, loading skeleton while fetching

## 7. Wiring

- [x] 7.1 Wire `AuthGate` and `CalendarView` into `packages/web/src/App.tsx`

## 8. Validation

- [x] 8.1 Verify full OAuth flow end-to-end in local dev: Worker at `localhost:8787`, frontend at `localhost:5173`
- [x] 8.2 Verify events sync and display correctly on the calendar after login
- [x] 8.3 Verify token refresh path: manually expire the access token in KV and confirm the next `GET /api/events` call refreshes it transparently
- [x] 8.4 Verify unauthenticated requests to `GET /api/events` return 401

