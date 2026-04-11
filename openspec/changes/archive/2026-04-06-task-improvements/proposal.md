## Why

Tasks are the core productivity unit of FlowDocs, but the current UI buries them in an unlabelled sidebar section and provides no dedicated view for managing them across time. Users cannot easily see all tasks at once, filter or sort them, or create standalone tasks that appear on the calendar independently.

## What Changes

- Add a labelled "Tasks" section header with a visual separator to the left sidebar so users can immediately identify the task list
- Allow task creation with an explicit date range so independent tasks appear as calendar blocks without being tied to a Google Calendar event
- Introduce a dedicated **Tasks page** (second nav item) with a filterable, sortable table showing all tasks (title, status, linked event, attached documents, date)
- In the Tasks page, clicking a row opens a detail dialog with the full task information and quick actions

## Capabilities

### New Capabilities

- `task-list-view`: Full-page task table with filter (by status/type) and sort (by date, name) controls; row click opens task detail dialog

### Modified Capabilities

- `task-sidebar-list`: Add a "Tasks" section title and separator above the accordion in the sidebar
- `task-crud`: Task creation now accepts `start` + `end` when no `eventId` is provided, and those tasks appear as calendar blocks (this was already supported at the DB/API level but not exposed in the UI form)
- `task-form`: Expose date/time pickers in `TaskFormModal` for standalone tasks (when no `eventId`)

## Impact

- `packages/web/src/components/layout/Sidebar.tsx` — add section header
- `packages/web/src/tasks/TaskFormModal.tsx` — add start/end date pickers for standalone tasks
- `packages/web/src/tasks/TaskListView.tsx` — new page component
- `packages/web/src/tasks/TaskDetailDialog.tsx` — new dialog component
- `packages/web/src/stores/appStore.ts` — add `"tasks"` as a valid `activePage` value
- `packages/web/src/google/CalendarView.tsx` — ensure standalone tasks already render as blocks (they do via existing `event_id IS NULL` path)
