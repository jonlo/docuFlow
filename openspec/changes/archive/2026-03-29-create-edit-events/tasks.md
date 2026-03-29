## 1. Shared Types

- [x] 1.1 Add `CreateEventBody` to `packages/shared/src/google/index.ts`: `{ title: string; start: string; end: string; attendees?: { email: string; name?: string }[] }`
- [x] 1.2 Add `UpdateEventBody` as `Partial<CreateEventBody>` to `packages/shared/src/google/index.ts`
- [x] 1.3 Add `ContactResult` type: `{ email: string; name?: string }`

## 2. Backend — Google API Layer

- [x] 2.1 Add `createCalendarEvent(accessToken, body: CreateEventBody): Promise<GoogleCalendarEvent>` to `packages/api/src/google/api.ts`
- [x] 2.2 Add `updateCalendarEvent(accessToken, googleEventId, body: UpdateEventBody): Promise<GoogleCalendarEvent>` to `packages/api/src/google/api.ts`
- [x] 2.3 Add `deleteCalendarEvent(accessToken, googleEventId): Promise<void>` to `packages/api/src/google/api.ts`
- [x] 2.4 Add `searchContacts(accessToken, query: string): Promise<ContactResult[]>` to `packages/api/src/google/api.ts` — calls Google People API `people:searchContacts`

## 3. Backend — Logic Layer

- [x] 3.1 Add `createEvent(userId, accessToken, body, env)` to `packages/api/src/google/calendar.ts`: calls `api.createCalendarEvent`, upserts result into D1, clears `synced_at` in KV, returns `CalendarEvent`
- [x] 3.2 Add `updateEvent(id, accessToken, body, env)` to `packages/api/src/google/calendar.ts`: looks up `google_event_id` from D1 by `id`, calls `api.updateCalendarEvent`, updates D1 row, clears `synced_at`, returns `CalendarEvent`
- [x] 3.3 Add `deleteEvent(id, accessToken, env)` to `packages/api/src/google/calendar.ts`: looks up `google_event_id` from D1, calls `api.deleteCalendarEvent`, deletes D1 row, clears `synced_at`

## 4. Backend — Routes

- [x] 4.1 Add `POST /api/events` route to `packages/api/src/google/routes.ts`: auth-required, call `ensureFreshToken`, delegate to `calendar.createEvent`, return `201`
- [x] 4.2 Add `PATCH /api/events/:id` route: auth-required, delegate to `calendar.updateEvent`, return `200`
- [x] 4.3 Add `DELETE /api/events/:id` route: auth-required, delegate to `calendar.deleteEvent`, return `204`
- [x] 4.4 Add `GET /api/contacts/search` route: auth-required, call `ensureFreshToken`, delegate to `api.searchContacts`, return results
- [x] 4.5 Add `contacts.readonly` scope to `buildConsentUrl` in `packages/api/src/google/auth.ts`

## 5. App State

- [x] 5.1 Add `eventModal` state to `packages/web/src/stores/appStore.ts`: `{ open: boolean; mode: 'create' | 'edit'; initialData?: Partial<EventFormValues>; eventId?: string; googleEventId?: string }`
- [x] 5.2 Add `openEventModal(mode, initialData?, eventId?, googleEventId?)` and `closeEventModal()` actions to `appStore`

## 6. Frontend — Hooks

- [x] 6.1 Create `packages/web/src/google/useEventMutations.ts`: TanStack Query `useMutation` hooks for `createEvent`, `updateEvent`, `deleteEvent` — each invalidates `["calendarEvents"]` on success

## 7. Frontend — EventFormModal

- [x] 7.1 Create `packages/web/src/google/EventFormModal.tsx` skeleton: modal shell (overlay + centered card), controlled by `appStore.eventModal.open`, close on backdrop click or Escape
- [x] 7.2 Add title input (required, shows validation error on empty submit)
- [x] 7.3 Add date picker, start time picker, end time picker (shows validation error if end ≤ start)
- [x] 7.4 Add attendee multi-input: text field that queries `/api/contacts/search` (debounced 300ms), shows dropdown of up to 5 suggestions, adds chip on selection; also accepts free-form email on Enter/comma
- [x] 7.5 Wire create submission: call `createEvent` mutation, show inline error on failure, close modal on success
- [x] 7.6 Wire edit submission: call `updateEvent` mutation, show inline error on failure, close modal on success
- [x] 7.7 Add delete button (edit mode only): show inline "Delete this event? Confirm / Cancel", call `deleteEvent` mutation on confirm, close modal on success

## 8. Frontend — Sidebar

- [x] 8.1 Remove month/week/day view buttons from `packages/web/src/components/layout/Sidebar.tsx`
- [x] 8.2 Add "New Event" primary button to sidebar: calls `openEventModal('create')`

## 9. Frontend — CalendarView

- [x] 9.1 Add `selectable` prop to `<Calendar>` in `packages/web/src/google/CalendarView.tsx`
- [x] 9.2 Add `onSelectSlot` handler: maps rbc `SlotInfo` to `EventFormValues` initial data, calls `openEventModal('create', initialData)`
- [x] 9.3 Add `onSelectEvent` handler: maps rbc event to `EventFormValues`, calls `openEventModal('edit', data, event.id, event.resource.googleEventId)`
- [x] 9.4 Add compact `ViewSwitcher` component (month/week/day toggle) rendered above the `<Calendar>` inside `CalendarView`
- [x] 9.5 Render `<EventFormModal />` at the bottom of `CalendarView` (or in `App.tsx`)

## 10. Validation

- [x] 10.1 Verify create flow: click empty slot → form pre-filled → submit → event appears on calendar
- [x] 10.2 Verify edit flow: click event → form pre-populated → edit → event updates on calendar
- [x] 10.3 Verify delete flow: click event → delete → confirm → event removed from calendar
- [x] 10.4 Verify attendee search returns Google contacts and free-form email works
- [x] 10.5 Verify view switcher moves correctly from sidebar to calendar area
