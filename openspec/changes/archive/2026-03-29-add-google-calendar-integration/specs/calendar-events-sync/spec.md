## ADDED Requirements

### Requirement: Fetch and sync events from Google Calendar
The system SHALL provide an endpoint `GET /api/events` that syncs and returns events. On each call, the system MUST check a `synced_at` timestamp stored per-user in KV. If the last sync was less than 5 minutes ago, the system MUST skip the Google API call and return events directly from D1. Otherwise it fetches from Google, upserts into D1, updates `synced_at`, and returns from D1. The sync window MUST cover 30 days before and 60 days after the current date.

> **Note**: `GET /api/events` performing a sync on read is a deliberate pragmatic trade-off for simplicity. A future `POST /api/events/sync` endpoint should be introduced when more control over sync timing is needed.

#### Scenario: Authenticated user fetches events — cache cold
- **WHEN** an authenticated client calls `GET /api/events` and `synced_at` is absent or older than 5 minutes
- **THEN** the system calls the Google Calendar API for events in the rolling window (now-30d to now+60d)
- **THEN** the system upserts each event into D1 `events` keyed on `google_event_id`
- **THEN** the system updates `synced_at` in KV for the user
- **THEN** the system returns `200` with an array of `CalendarEvent` objects from D1

#### Scenario: Authenticated user fetches events — cache warm
- **WHEN** an authenticated client calls `GET /api/events` and `synced_at` is within the last 5 minutes
- **THEN** the system skips the Google Calendar API call
- **THEN** the system returns `200` with events directly from D1

#### Scenario: Unauthenticated request
- **WHEN** a client calls `GET /api/events` without a valid session cookie
- **THEN** the system returns `401` with `{ "error": "Not authenticated", "code": "UNAUTHENTICATED" }`

### Requirement: Idempotent event upsert
The system SHALL upsert Google Calendar events into D1 using `google_event_id` as the unique key via `INSERT INTO events (...) ON CONFLICT(google_event_id) DO UPDATE SET ...`. This MUST NOT use `INSERT OR REPLACE`, which would delete and re-insert the row, changing the primary key and cascading-deleting linked tasks.

#### Scenario: Event already exists in D1
- **WHEN** the system syncs an event whose `google_event_id` already exists in D1
- **THEN** the system updates the existing row with the latest `title`, `start`, `end`, and `description` values
- **THEN** no duplicate row is created

#### Scenario: New event not yet in D1
- **WHEN** the system syncs an event whose `google_event_id` does not exist in D1
- **THEN** the system inserts a new row in the `events` table

### Requirement: Map Google Calendar event fields to D1 schema
The system SHALL map Google Calendar API event fields to the D1 `events` table columns as follows: `summary` → `title`, `start.dateTime` or `start.date` → `start` (ISO 8601), `end.dateTime` or `end.date` → `end` (ISO 8601), `description` → `description`. The `user_id` column MUST be set to the authenticated user's D1 row id.

#### Scenario: Event with dateTime (timed event)
- **WHEN** a Google Calendar event has `start.dateTime` and `end.dateTime`
- **THEN** these values are stored as-is (ISO 8601 with timezone offset) in the `start` and `end` columns

#### Scenario: Event with date only (all-day event)
- **WHEN** a Google Calendar event has `start.date` and `end.date` (all-day format)
- **THEN** these values are stored as ISO 8601 date strings (e.g., `2026-03-29`) in the `start` and `end` columns

### Requirement: Return events as CalendarEvent shape
The `GET /api/events` response MUST conform to the `CalendarEvent` type defined in `packages/shared`. Each event MUST include `id`, `googleEventId`, `title`, `start`, `end`, and optionally `description`.

#### Scenario: Successful response shape
- **WHEN** the system returns events from `GET /api/events`
- **THEN** each item in the array has `id` (D1 row id), `googleEventId`, `title`, `start` (ISO 8601 string), `end` (ISO 8601 string), and `description` (string or null)
