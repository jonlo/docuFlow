## Context

FlowDocs already has a full task CRUD API, a `TaskFormModal`, and a sidebar accordion that lists tasks by status. The D1 schema supports standalone tasks (`event_id IS NULL`, with `start`/`end` required), and the calendar already renders them as event blocks via `react-big-calendar`. However:

- The sidebar has no visual label for the task section — it blends into the nav
- `TaskFormModal` never shows date pickers, so standalone tasks always get `start = now`, `end = now+1h` defaults that the user cannot control
- There is no dedicated page for viewing all tasks — the only view is the sidebar accordion

## Goals / Non-Goals

**Goals:**
- Sidebar section header ("Tasks") with a separator, visually anchoring the task list
- Date/time pickers in `TaskFormModal` when creating/editing a standalone task (no linked event)
- New `TaskListView` page accessible via the sidebar nav, showing a full table of all tasks
- Table columns: title, status, linked event name (or "—"), attached documents (count + tooltipped titles), start date
- Filter by status (all / waiting / in progress / completed) via segmented control
- Sort by date (default) or name via column header click
- Row click opens `TaskDetailDialog` with full task info and an Edit button to open `TaskFormModal`

**Non-Goals:**
- Drag-and-drop reordering of tasks in the table
- Bulk actions (multi-select delete, bulk status change)
- Inline editing within the table cells
- Pagination (all tasks fit in a single query; add if scale demands it)
- Task recurrence or reminders

## Decisions

### 1. Tasks page as a new `activePage` value
**Decision:** Extend the Zustand `activePage` type from `"calendar" | "labels"` to `"calendar" | "labels" | "tasks"` and add a "Tasks" nav item to the sidebar.

**Rationale:** The existing page-switching pattern (set `activePage` → conditionally render the page component) is clean and already used for the labels page. No router needed.

### 2. `TaskDetailDialog` vs reusing `TaskFormModal` directly
**Decision:** Introduce a lightweight read-only `TaskDetailDialog` (title, status, dates, linked event, documents list) with an "Edit" button that opens `TaskFormModal` in edit mode.

**Rationale:** The task list row click should be fast and non-destructive — a read view first, edit on demand. Jumping straight to an edit form is jarring and risks accidental edits.

### 3. Date pickers for standalone tasks
**Decision:** In `TaskFormModal`, show `<input type="datetime-local">` fields for `start` and `end` when `mode === "create"` and no `eventId`, or when the existing task has `eventId === undefined`. Pre-fill with the current hour (rounded) and +1h.

**Rationale:** The simplest native input that works without adding a datepicker library. Consistent with the existing stack (no new deps).

### 4. Filtering and sorting — client-side
**Decision:** Fetch all tasks once via `useTasks()` (already cached by TanStack Query) and filter/sort in the component with `useMemo`.

**Rationale:** Task counts are small (tens to low hundreds per user). A server-side filter endpoint already exists (`?status=`) but client-side gives instant UI feedback without extra requests.

### 5. Table layout
**Decision:** Plain HTML `<table>` styled with Tailwind. No third-party table library.

**Rationale:** The requirements (filter, sort, row click) are straightforward and don't justify the weight of TanStack Table or similar.

## Risks / Trade-offs

- **Date picker UX on macOS**: `datetime-local` renders natively and looks inconsistent across browsers. Acceptable for v1; a proper date-picker component can replace it later without API changes.
- **Large task lists**: Client-side sort/filter will degrade past ~1000 tasks. Mitigation: the existing `?status=` filter on `GET /api/tasks` can be used to page if needed — but this is not a v1 concern.
- **`TaskDetailDialog` duplicates some `TaskFormModal` display logic**: Acceptable duplication — the dialog is read-only and structurally different enough that abstracting a shared component would be premature.
