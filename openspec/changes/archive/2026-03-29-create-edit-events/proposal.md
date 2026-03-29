## Why

FlowDocs currently only displays synced Google Calendar events — users have no way to create, edit, or delete events from within the app. Adding full event CRUD makes FlowDocs a first-class calendar client rather than a read-only viewer, which is the core productivity loop: see your schedule, manage it, attach tasks to it.

## What Changes

- **Remove** month/week/day view buttons from the sidebar
- **Add** a primary "New Event" button to the sidebar
- **Add** click-to-create on empty calendar cells (month view) — opens event form with the clicked date pre-filled
- **Add** click-and-drag to create on week/day view — opens event form with the dragged time range pre-filled
- **Add** `EventFormModal` — a modal for creating and editing events, with fields for: title, date, start/end time, attendees (Google contacts lookup + free-form email input)
- **Add** click on existing event → opens `EventFormModal` in edit mode with populated fields, plus a Delete button
- **Add** backend `POST /api/events` (create), `PATCH /api/events/:id` (update), `DELETE /api/events/:id` (delete) — write through to Google Calendar API and update D1
- **Add** sidebar view switcher moved to the calendar toolbar (or a compact icon group above the calendar)

## Capabilities

### New Capabilities

- `event-create`: Click/drag interactions on the calendar to initiate event creation; "New Event" button in sidebar
- `event-form`: Modal form for creating and editing events — title, date, time range, attendees (Google Contacts lookup + free email)
- `event-mutations`: Backend routes and logic for creating, updating, and deleting events via Google Calendar API with D1 sync

### Modified Capabilities

- `calendar-view`: Adds `selectable` prop for click/drag-to-create, `onSelectSlot` and `onSelectEvent` handlers. View switcher moves from sidebar to calendar toolbar.

## Impact

- **packages/web**: New `EventFormModal` component; updates to `CalendarView`, `Sidebar`, `appStore` (add modal state); new `useEventMutations` hook
- **packages/api/src/google/**: New `routes.ts` entries for POST/PATCH/DELETE `/api/events/:id`; new logic in `calendar.ts` for write-through to Google Calendar API
- **packages/shared/src/google/**: New `CreateEventBody`, `UpdateEventBody` shared types
- **Google Calendar API**: Requires `calendar.events` write scope (already requested in the OAuth flow)
