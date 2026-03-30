## 1. Store — Detail Modal State

- [x] 1.1 Add `detailModal: { open: boolean; event: CalendarEvent | null }` to `AppState` in `packages/web/src/stores/appStore.ts`
- [x] 1.2 Add `openDetailModal(event: CalendarEvent)` action to appStore
- [x] 1.3 Add `closeDetailModal()` action to appStore

## 2. EventDetailModal Component

- [x] 2.1 Create `packages/web/src/google/EventDetailModal.tsx` — reads `detailModal` from appStore, renders nothing when `open` is false
- [x] 2.2 Add modal backdrop (fixed inset, `bg-black/30`) with click-to-close on backdrop click
- [x] 2.3 Add Escape key listener to close the modal
- [x] 2.4 Render header row: event title (bold) + pencil icon button (opens edit) + ✕ close button
- [x] 2.5 Render date/time row: formatted start and end with date-fns
- [x] 2.6 Render label chips row (only if event has labels): coloured rounded chips with name
- [x] 2.7 Render attendees row (only if event has attendees): name or email, comma-separated or stacked
- [x] 2.8 Render description row (only if event has description): plain read-only text
- [x] 2.9 Wire pencil button: `closeDetailModal()` then `openEventModal("edit", { ...fields }, id, googleEventId)`

## 3. CalendarView Integration

- [x] 3.1 Update `handleSelectEvent` in `packages/web/src/google/CalendarView.tsx` to call `openDetailModal(resource)` instead of `openEventModal("edit", ...)`
- [x] 3.2 Remove the `openEventModal` import/usage from `handleSelectEvent` (it stays for slot selection)
- [x] 3.3 Render `<EventDetailModal />` in `CalendarView` alongside the existing `<EventFormModal />`

## 4. Validation

- [x] 4.1 Verify clicking an event opens the detail modal (not the edit form) in all three views
- [x] 4.2 Verify the detail modal shows title, time, labels, attendees, description correctly
- [x] 4.3 Verify clicking the pencil icon closes the detail modal and opens the edit form pre-populated
- [x] 4.4 Verify clicking empty slot still opens the create form directly
- [x] 4.5 Verify Escape and backdrop click close the detail modal
