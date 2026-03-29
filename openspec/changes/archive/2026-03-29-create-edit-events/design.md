## Context

The app currently has a read-only calendar view that syncs events from Google Calendar. The OAuth scope already requests `calendar.events` (write), so no re-auth flow is needed. The backend has `google/api.ts` for raw HTTP and `google/calendar.ts` for sync logic. The frontend uses react-big-calendar, which natively supports `selectable` mode for click/drag slot selection.

Google Calendar is the source of truth. All creates, updates, and deletes go through the Google Calendar API first, then D1 is updated to match.

## Goals / Non-Goals

**Goals:**
- Create events via sidebar button, month cell click, and week/day click-drag
- Edit event title, date, start/end time, and attendees via a modal form
- Delete events (with confirmation)
- Attendee input: Google Contacts People API lookup + free-form email fallback
- Write-through: Google Calendar API → D1 → TanStack Query cache invalidation
- Move view switcher (month/week/day) from sidebar to calendar toolbar area

**Non-Goals:**
- Recurring event creation or editing
- Google Meet / conference link generation
- Event color picker (uses Google's colorId)
- Drag-to-reschedule existing events (separate change)
- Offline / optimistic updates (invalidate and refetch is sufficient for now)

## Decisions

### 1. EventFormModal: controlled modal in Zustand

Add `eventModal` state to `appStore`:
```ts
eventModal: {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: Partial<EventFormValues>;
  eventId?: string;          // set in edit mode
}
```
`CalendarView` calls `openEventModal(...)` on slot select / event click. `Sidebar` calls it with no initial data for the "New Event" button.

**Why Zustand over local state**: The modal can be triggered from multiple places (sidebar, calendar). Zustand avoids prop-drilling and keeps the trigger logic out of `CalendarView`.

### 2. Attendees: People API + free-form email

When the user types in the attendee field, call `GET /api/contacts/search?q=<query>` which proxies to the Google People API (`people.connections.list` or `people:searchContacts`). If the query doesn't match a contact, allow adding it as a raw email (validated client-side). Store attendees as `{ email: string; name?: string; self?: boolean }[]`.

**Why not just free-form email**: Google Contacts lookup covers the common case (colleagues) without the user needing to remember exact addresses. Free-form is the fallback for external guests.

**Scope note**: `https://www.googleapis.com/auth/contacts.readonly` needs to be added to the OAuth consent URL. This requires a new consent prompt for existing users (or re-auth). For local dev this is fine; production requires re-auth on next login.

### 3. Write-through: Google API first, then D1

For create/update: call Google Calendar API → on success, upsert the returned event into D1 using the same `ON CONFLICT(google_event_id) DO UPDATE` pattern. For delete: call Google API → on success, delete from D1.

**Why not D1-first**: Google is the source of truth. Writing to D1 before Google could leave D1 in a state that contradicts Google if the API call fails.

**Error handling**: If the Google API call fails, return the error to the client — no D1 mutation occurs.

### 4. react-big-calendar `selectable` + `onSelectSlot`

Enable `selectable` on the `<Calendar>` component. `onSelectSlot` fires with `{ start, end, action }` where action is `'click'` (month) or `'select'` (drag on week/day). Both open `EventFormModal` with the slot range pre-filled.

**Why**: rbc handles all the UX for slot selection natively — no custom drag logic needed.

### 5. View switcher moves to calendar header

Remove view buttons from `Sidebar`. Add a compact `ViewSwitcher` component rendered above the `<Calendar>` (or use rbc's built-in toolbar). This keeps the sidebar focused on actions ("New Event", integrations).

## Risks / Trade-offs

- **People API scope requires re-auth** → New users get it in the initial OAuth. Existing users need to reconnect. Document this clearly; the reconnect flow is the same popup OAuth.
- **Google API rate limits on create/update** → Not a concern for single-user local usage; acceptable for MVP.
- **Cache invalidation after mutations** → Invalidate `["calendarEvents"]` query after any mutation. The 5-min `synced_at` KV guard must be cleared on mutation so the next fetch re-syncs from Google.
- **Delete confirmation** → Show an inline "Are you sure?" step in the modal rather than a separate dialog, to keep the interaction lightweight.

## Open Questions

- Should the modal be full-screen on mobile or a centered dialog? (Assume centered dialog for desktop-first.)
- Should attendees added in FlowDocs be synced back to the Google event's `attendees` field? (Yes — include them in the Google Calendar API payload.)
