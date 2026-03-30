## Why

Events need a lightweight organisation layer. Labels let users tag events with colour-coded categories (e.g. "Work", "Personal", "Urgent") so the calendar communicates meaning at a glance — without requiring a full task-management workflow first.

## What Changes

- A new **Labels** section in the sidebar under a "Config" heading, from which users can create, rename, recolour, and delete labels
- The **EventFormModal** gains a label multi-select input (similar to the attendee chip UI): type to search existing labels, or create a new one inline with a name and colour picker
- **Labels are stored in D1** in the existing `labels` table and associated to events via the existing `entity_labels` pivot table
- **CalendarView event cards** show applied labels as small coloured chips at the bottom of each block
- A new `GET /api/labels` and `POST /api/labels` endpoint for listing and creating labels, and a `DELETE /api/labels/:id` endpoint for deletion
- A new `PUT /api/events/:id/labels` endpoint to set the label associations for an event

## Capabilities

### New Capabilities

- `label-management`: CRUD for labels (create with name + colour, list, delete) via sidebar Config > Labels page and inline from EventFormModal
- `event-label-assignment`: Assigning and removing labels on events from the EventFormModal; rendering label chips on calendar event cards

### Modified Capabilities

- `event-form`: EventFormModal gains a label input field (search + inline create)
- `calendar-view`: Event cards gain small label chip rendering at the bottom

## Impact

- **Backend**: New routes in `packages/api/src/routes/labels.ts`; `entity_labels` pivot already exists in schema — only need to wire API
- **Frontend**: New `LabelsPage` component + sidebar nav entry; `EventFormModal` extended; `CalendarView` event block updated
- **Shared types**: New `Label` type in `packages/shared`; `CalendarEvent` extended with `labels?: Label[]`
- **D1**: `labels` and `entity_labels` tables already exist — no schema migration needed
