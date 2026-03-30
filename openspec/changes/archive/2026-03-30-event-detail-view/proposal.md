## Why

Clicking a calendar event currently opens the full edit form immediately, which is jarring — users often just want to glance at event details. A read-only detail view as the default click action reduces accidental edits and feels more natural (matching Google Calendar's behaviour).

## What Changes

- Clicking an event on the calendar opens a compact read-only **EventDetailModal** instead of the edit form
- The detail modal shows: title, date/time, attendees, labels, and an optional description
- An edit (pencil) icon button in the detail modal header opens the existing `EventFormModal` in edit mode
- The existing `onSelectEvent` handler in `CalendarView` is updated to open the detail modal instead of the edit modal directly

## Capabilities

### New Capabilities
- `event-detail-view`: Read-only event detail popover/modal shown when a calendar event is clicked, with an edit action that transitions to the edit form

### Modified Capabilities
- `calendar-view`: `onSelectEvent` now opens the detail view instead of directly opening the edit form

## Impact

- New component: `packages/web/src/google/EventDetailModal.tsx`
- Modified: `packages/web/src/google/CalendarView.tsx` — `handleSelectEvent` opens detail modal
- Modified: `packages/web/src/stores/appStore.ts` — add `detailModal` state alongside `eventModal`
- No backend changes
