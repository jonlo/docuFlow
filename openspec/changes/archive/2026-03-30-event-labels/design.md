## Context

The D1 schema already contains `labels (id, name, color, created_at, updated_at)` and `entity_labels (entity_type, entity_id, label_id)`. No migration is needed — the tables just need to be wired up. The API follows the same Hono + hexagonal-lite pattern as the Google domain routes. The frontend follows the same Zustand + TanStack Query + shadcn/Tailwind stack.

## Goals / Non-Goals

**Goals:**
- CRUD labels via a new sidebar Config → Labels page
- Assign/remove labels on events from EventFormModal (search existing + inline create)
- Render label chips on calendar event cards
- All label data fetched from D1; Google Calendar has no label concept (labels are FlowDocs-only)

**Non-Goals:**
- Labels on tasks (future work)
- Label filtering of the calendar view (future work)
- Label sharing between users (all labels are global to the single-user session for now)

## Decisions

### 1. Store labels in D1, not in Google Calendar

**Decision:** Labels live entirely in D1 (`labels` + `entity_labels`). They are not synced to Google Calendar (Google has no label concept, only colorId).

**Rationale:** Attempting to encode labels in event descriptions or extended properties would make them fragile and hard to query. D1 is the right store for relational metadata.

**Alternative considered:** Use Google Calendar event's `extendedProperties` — rejected because it would couple our label system to Google's API and complicate the sync logic.

### 2. Separate labels API routes (`/api/labels`)

**Decision:** New Hono router at `packages/api/src/routes/labels.ts` mounted at `/api/labels`, rather than embedding label logic in the Google routes.

**Rationale:** Labels are not a Google concept. Keeping them in a separate router avoids polluting the Google domain and makes the boundary clear.

### 3. Event–label association via `PUT /api/events/:id/labels` (replace-all)

**Decision:** A single `PUT /api/events/:id/labels` body `{ labelIds: string[] }` replaces all labels for an event atomically (DELETE existing + INSERT new in one transaction).

**Rationale:** The modal always sends the full desired label set, so a replace-all is simpler than maintaining add/remove deltas. SQLite transactions make it safe.

**Alternative considered:** Separate `POST` and `DELETE` per label — rejected because it requires more round trips and complex optimistic UI state.

### 4. Inline label creation from EventFormModal

**Decision:** Typing a new label name shows a "Create label '<name>'" option at the bottom of the dropdown. Selecting it opens a small inline popover to pick a colour, then immediately calls `POST /api/labels` and adds the result as a chip.

**Rationale:** Mirrors the attendee UX pattern already in the modal. Avoids forcing users to leave the modal and go to Config → Labels just to add a new tag.

### 5. Colour representation

**Decision:** Colors stored as hex strings (e.g. `#6B5ECD`). The UI offers a fixed palette of 8 preset colours matching the design system's event colour families.

**Rationale:** A fixed palette keeps the UI simple and ensures all label colours look good against the light lavender-gray background. Free colour entry is deferred.

### 6. CalendarEvent enriched with labels on GET /api/events

**Decision:** `GET /api/events` performs a JOIN against `entity_labels` + `labels` and includes `labels: Label[]` on each `CalendarEvent` response.

**Rationale:** Avoids a second round-trip on the frontend. The event list is already the hot path; a LEFT JOIN is cheap at the event volumes FlowDocs targets (≤250 events per window).

## Risks / Trade-offs

- **JOIN on GET /api/events** → Slightly more complex query. Mitigation: use a single `SELECT … LEFT JOIN` with GROUP and JSON aggregation, which SQLite handles well.
- **Replace-all label association** → A race condition is possible if two tabs update labels simultaneously. Mitigation: acceptable for a single-user app; revisit with optimistic locking if multi-user is added.
- **No label filtering yet** → Users may find the chips decorative-only frustrating if they have many labels. Mitigation: clearly scoped as a future feature; the data model supports it trivially.
