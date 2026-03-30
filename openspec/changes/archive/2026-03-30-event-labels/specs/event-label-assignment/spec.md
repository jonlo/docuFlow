## ADDED Requirements

### Requirement: Set event labels endpoint
The system SHALL provide `PUT /api/events/:id/labels` (auth-required) that accepts `{ labelIds: string[] }` and atomically replaces all label associations for the event in the `entity_labels` pivot table.

#### Scenario: Successful label assignment
- **WHEN** an authenticated client calls `PUT /api/events/:id/labels` with `{ labelIds: ["id1", "id2"] }`
- **THEN** the system deletes all existing `entity_labels` rows for this event
- **THEN** the system inserts new rows for each provided `labelId`
- **THEN** the system returns `200` with the updated `CalendarEvent` including the `labels` array

#### Scenario: Clearing all labels
- **WHEN** a client calls `PUT /api/events/:id/labels` with `{ labelIds: [] }`
- **THEN** the system removes all label associations for the event
- **THEN** the system returns `200` with `labels: []`

#### Scenario: Event not found
- **WHEN** the event `id` does not exist in D1
- **THEN** the system returns `404` with `{ error: "Event not found", code: "NOT_FOUND" }`

#### Scenario: Invalid label id
- **WHEN** one or more `labelIds` do not exist in the `labels` table
- **THEN** the system returns `400` with `{ error: "One or more label IDs are invalid", code: "INVALID_LABEL_IDS" }`

### Requirement: CalendarEvent includes labels
The `GET /api/events` response SHALL include a `labels` field on each event containing the array of labels assigned to that event (via a JOIN on `entity_labels` + `labels`). Events with no labels MUST return `labels: []`.

#### Scenario: Event has labels
- **WHEN** `GET /api/events` returns an event that has label associations
- **THEN** the event object includes `labels: [{ id, name, color }, ...]`

#### Scenario: Event has no labels
- **WHEN** `GET /api/events` returns an event with no label associations
- **THEN** the event object includes `labels: []`
