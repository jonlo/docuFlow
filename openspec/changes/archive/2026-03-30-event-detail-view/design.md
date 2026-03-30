## Context

Currently `CalendarView.handleSelectEvent` calls `openEventModal("edit", ...)` directly. The `EventFormModal` is a full-height scrollable form with editable inputs. There is no intermediate read-only state. The store has one modal slot: `eventModal`.

## Goals / Non-Goals

**Goals:**
- Read-only detail view as the primary click action on any calendar event
- Compact size (narrower, shorter than the edit form)
- Single edit button (pencil icon) in the header that transitions to `EventFormModal` in edit mode
- Smooth UX: detail modal closes, edit modal opens (or detail modal stays and edit overlays)

**Non-Goals:**
- Inline editing within the detail view
- Drag-to-reschedule or any other mutation from the detail view
- A detail view for tasks (only calendar events)

## Decisions

### 1. Separate modal state slot in appStore

Add `detailModal: { open, event: CalendarEvent | null }` alongside the existing `eventModal`. This keeps the two modals independent — the detail modal can close while the edit modal opens without a flash.

**Alternative considered:** Reuse `eventModal` with a `mode: "view"`. Rejected because `EventFormModal` initialises form state on open and mixing view/edit modes adds complexity with no benefit.

### 2. New `EventDetailModal` component

A standalone component at `packages/web/src/google/EventDetailModal.tsx`. It receives the full `CalendarEvent` from `appStore.detailModal.event` and renders read-only rows. The pencil button calls `closeDetailModal()` then `openEventModal("edit", ...)`.

**Alternative considered:** Convert `EventFormModal` to have a locked read-only mode. Rejected — inputs with `disabled` still look like a form, and the sizing/layout requirements differ.

### 3. Detail modal layout

- Max width `sm` (384px), auto height (no scroll for typical events)
- Header: title + pencil icon button (right) + close ✕ button (far right)
- Body rows: date/time, attendees (if any), labels chips (if any), description (if any)
- No footer action buttons (save/delete live in the edit form)

### 4. Transition from detail → edit

1. User clicks pencil icon
2. `closeDetailModal()` → `openEventModal("edit", { ...event fields... }, event.id, event.googleEventId)`

This is a simple sequential state update — React batches them so there's no flicker.

## Risks / Trade-offs

- **Double-click friction**: Users who always want to edit now need two clicks. Mitigation: the pencil button is prominent in the header, one click away.
- **State duplication**: `detailModal.event` duplicates data already in the TanStack Query cache. Mitigation: it's ephemeral UI state — cleared on close, never mutated.

## Migration Plan

No backend changes. Frontend-only. No data migration needed. The existing `EventFormModal` is unchanged; only its trigger point in `CalendarView` changes.
