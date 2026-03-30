## 1. Shared Types

- [x] 1.1 Add `Label` type to `packages/shared/src/index.ts`: `{ id: string; name: string; color: string }`
- [x] 1.2 Add `labels?: Label[]` field to `CalendarEvent` in `packages/shared/src/google/index.ts`
- [x] 1.3 Add `CreateLabelBody` type: `{ name: string; color: string }`

## 2. Backend — Labels API

- [x] 2.1 Create `packages/api/src/routes/labels.ts` with `GET /api/labels` — query D1 `SELECT * FROM labels ORDER BY name` and return `Label[]`
- [x] 2.2 Add `POST /api/labels` to labels router — insert into D1, handle duplicate name → 409, missing fields → 400, return 201 with created label
- [x] 2.3 Add `DELETE /api/labels/:id` to labels router — delete from D1 (CASCADE removes entity_labels rows), return 204 or 404
- [x] 2.4 Mount labels router in `packages/api/src/index.ts` at `/api/labels`

## 3. Backend — Event Label Assignment

- [x] 3.1 Add `PUT /api/events/:id/labels` to `packages/api/src/google/routes.ts` — validate event exists, validate all labelIds exist, DELETE existing entity_labels for event then INSERT new ones in a transaction, return updated CalendarEvent
- [x] 3.2 Update `syncAndReturnEvents` in `packages/api/src/google/calendar.ts` — JOIN `entity_labels` + `labels` and include `labels: Label[]` on each returned `CalendarEvent`
- [x] 3.3 Update `createEvent` and `updateEvent` in `calendar.ts` — include labels JOIN in the final SELECT so returned `CalendarEvent` includes labels
- [x] 3.4 Update `toCalendarEvent` helper in `calendar.ts` — map joined label rows (JSON aggregated) to `labels` field

## 4. Frontend — Labels Store & Query

- [x] 4.1 Create `packages/web/src/hooks/useLabels.ts` — TanStack Query `useQuery` for `GET /api/labels`, queryKey `["labels"]`
- [x] 4.2 Create `packages/web/src/hooks/useSetEventLabels.ts` — TanStack Query `useMutation` for `PUT /api/events/:id/labels`, invalidates `["calendarEvents"]` on success
- [x] 4.3 Add `useCreateLabel` mutation to a new `packages/web/src/hooks/useLabelMutations.ts`: calls `POST /api/labels`, invalidates `["labels"]` on success
- [x] 4.4 Add `useDeleteLabel` mutation to `useLabelMutations.ts`: calls `DELETE /api/labels/:id`, invalidates `["labels"]` on success

## 5. Frontend — EventFormModal Label Input

- [x] 5.1 Add label input to `packages/web/src/google/EventFormModal.tsx`: chip multi-select filtered client-side from `useLabels()` data, renders a dropdown on focus/type
- [x] 5.2 Add "Create label '<name>'" option to dropdown when no match — show inline 8-colour palette on selection, call `useCreateLabel` on confirm, add result as chip
- [x] 5.3 Initialise label chips from `initialData.labels` when modal opens in edit mode
- [x] 5.4 On form submit (create or edit) call `useSetEventLabels` with the event id and selected label ids after the event mutation succeeds

## 6. Frontend — Calendar Event Card

- [x] 6.1 Update `EventBlock` component in `packages/web/src/google/CalendarView.tsx` — render label chips at the bottom of the block (small coloured dot + name, truncated, max 2 visible)
- [x] 6.2 Pass `resource.labels` into the edit modal via `handleSelectEvent`

## 7. Frontend — Sidebar Config & Labels Page

- [x] 7.1 Add a "Config" section to `packages/web/src/components/layout/Sidebar.tsx` with a "Labels" nav item
- [x] 7.2 Add `activePage` state to `appStore.ts`: `'calendar' | 'labels'` with `setActivePage` action
- [x] 7.3 Create `packages/web/src/components/labels/LabelsPage.tsx` — list all labels (colour swatch + name + delete button) using `useLabels()` and `useDeleteLabel()`
- [x] 7.4 Add create label form to `LabelsPage`: name input + 8-colour palette + submit button using `useCreateLabel()`
- [x] 7.5 Wire `activePage` in `packages/web/src/App.tsx` (or root layout) — render `<LabelsPage />` or `<CalendarView />` based on active page

## 8. Validation

- [x] 8.1 Verify labels list and create via Config → Labels page
- [x] 8.2 Verify delete label removes it from the list and from existing event cards
- [x] 8.3 Verify label search and selection in EventFormModal
- [x] 8.4 Verify inline label creation from EventFormModal
- [x] 8.5 Verify label chips appear on calendar event cards after save
- [x] 8.6 Verify edit modal pre-populates label chips for events that have labels
