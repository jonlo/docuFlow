## ADDED Requirements

### Requirement: Create event endpoint
The system SHALL provide `POST /api/events` (auth-required) that accepts a `CreateEventBody`, creates the event in Google Calendar, upserts the returned event into D1, clears `synced_at` in KV so the next fetch re-syncs, and returns the created `CalendarEvent`.

#### Scenario: Successful event creation
- **WHEN** an authenticated client calls `POST /api/events` with a valid `CreateEventBody`
- **THEN** the system creates the event in Google Calendar
- **THEN** the system upserts the returned event into D1 via `ON CONFLICT(google_event_id) DO UPDATE`
- **THEN** the system clears `synced_at` in KV for the user
- **THEN** the system returns `201` with the created `CalendarEvent`

#### Scenario: Unauthenticated create request
- **WHEN** a client calls `POST /api/events` without a valid session
- **THEN** the system returns `401` with `{ "error": "Not authenticated", "code": "UNAUTHENTICATED" }`

#### Scenario: Google API error on create
- **WHEN** the Google Calendar API returns an error during event creation
- **THEN** the system returns `502` with `{ "error": "Google API error", "code": "GOOGLE_API_ERROR" }` and does not modify D1

### Requirement: Update event endpoint
The system SHALL provide `PATCH /api/events/:id` (auth-required) that accepts an `UpdateEventBody`, updates the event in Google Calendar using the event's `googleEventId` (looked up from D1 by the route param `id`), updates the D1 row, clears `synced_at`, and returns the updated `CalendarEvent`.

#### Scenario: Successful event update
- **WHEN** an authenticated client calls `PATCH /api/events/:id` with a valid `UpdateEventBody`
- **THEN** the system updates the event in Google Calendar
- **THEN** the system updates the D1 row with the new field values
- **THEN** the system clears `synced_at` in KV for the user
- **THEN** the system returns `200` with the updated `CalendarEvent`

#### Scenario: Event not found
- **WHEN** a client calls `PATCH /api/events/:id` with an id that does not exist in D1
- **THEN** the system returns `404` with `{ "error": "Event not found", "code": "NOT_FOUND" }`

### Requirement: Delete event endpoint
The system SHALL provide `DELETE /api/events/:id` (auth-required) that deletes the event from Google Calendar and removes the D1 row. Cascade delete via the FK constraint removes any linked tasks.

#### Scenario: Successful event deletion
- **WHEN** an authenticated client calls `DELETE /api/events/:id`
- **THEN** the system deletes the event from Google Calendar
- **THEN** the system deletes the D1 row (cascading to linked tasks via FK)
- **THEN** the system clears `synced_at` in KV for the user
- **THEN** the system returns `204` with no body

#### Scenario: Event not found on delete
- **WHEN** a client calls `DELETE /api/events/:id` with an id that does not exist in D1
- **THEN** the system returns `404` with `{ "error": "Event not found", "code": "NOT_FOUND" }`

### Requirement: Google Contacts search endpoint
The system SHALL provide `GET /api/contacts/search?q=<query>` (auth-required) that queries the Google People API and returns up to 5 matching contacts as `{ email: string; name?: string }[]`.

#### Scenario: Query returns matches
- **WHEN** an authenticated client calls `GET /api/contacts/search?q=alice`
- **THEN** the system queries the Google People API and returns up to 5 contacts whose name or email contains "alice"

#### Scenario: Query returns no matches
- **WHEN** the query matches no contacts
- **THEN** the system returns `200` with an empty array

#### Scenario: Unauthenticated contacts search
- **WHEN** a client calls `GET /api/contacts/search` without a valid session
- **THEN** the system returns `401`

### Requirement: CreateEventBody and UpdateEventBody shared types
The system SHALL define `CreateEventBody` and `UpdateEventBody` in `packages/shared/src/google/index.ts`. `CreateEventBody` MUST include `title` (required), `start` (ISO 8601, required), `end` (ISO 8601, required), and optional `attendees` (`{ email: string; name?: string }[]`). `UpdateEventBody` SHALL be a partial of `CreateEventBody`.

#### Scenario: Type usage in API
- **WHEN** `packages/api` handles `POST /api/events`
- **THEN** the request body is validated against `CreateEventBody` from `packages/shared`
