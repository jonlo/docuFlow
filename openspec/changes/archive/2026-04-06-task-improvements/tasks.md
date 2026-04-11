## 1. App Store & Navigation

- [x] 1.1 Add `"tasks"` to the `activePage` union type in `packages/web/src/stores/appStore.ts`
- [x] 1.2 Add a "Tasks" nav item to `Sidebar` that calls `setActivePage("tasks")`
- [x] 1.3 Render `TaskListView` in the main content area when `activePage === "tasks"`

## 2. Sidebar Tasks Section Header

- [x] 2.1 Add a "Tasks" section label and `<hr>` separator above the status accordion in `Sidebar.tsx`
- [x] 2.2 Ensure the header is always visible regardless of task count (no conditional rendering)

## 3. TaskFormModal — Date Pickers for Standalone Tasks

- [x] 3.1 Add `start` and `end` state (datetime strings) to `TaskFormModal`
- [x] 3.2 Show `<input type="datetime-local">` pickers for start and end only when no `eventId` is present; pre-fill with current hour and +1h in create mode, from task data in edit mode
- [x] 3.3 Add `start > end` validation error before submission
- [x] 3.4 Include `start` and `end` in the `createTask.mutateAsync` / `updateTask.mutateAsync` body for standalone tasks

## 4. TaskListView Page

- [x] 4.1 Create `packages/web/src/tasks/TaskListView.tsx` with a full-page layout, page title, and filter control
- [x] 4.2 Implement status filter: segmented control with All / Waiting / In Progress / Completed; filter tasks client-side with `useMemo`
- [x] 4.3 Render tasks in a `<table>` with columns: Title, Status, Event, Documents, Date; apply active filter and sort
- [x] 4.4 Implement column sort by clicking "Title" or "Date" headers (toggle asc/desc); show sort arrow indicator
- [x] 4.5 Add empty state row ("No tasks") when filtered result is empty

## 5. TaskDetailDialog

- [x] 5.1 Create `packages/web/src/tasks/TaskDetailDialog.tsx` — modal dialog showing read-only task details: title, status, start/end, linked event name, attached documents as clickable links
- [x] 5.2 Add an Edit button that closes the dialog and opens `TaskFormModal` in edit mode for the task
- [x] 5.3 Close the dialog on outside click or Escape key

## 6. Wire TaskDetailDialog to TaskListView

- [x] 6.1 Add `selectedTask` state to `TaskListView`; set it on row click
- [x] 6.2 Render `TaskDetailDialog` when `selectedTask` is set; clear it on close

## 7. Validation

- [x] 7.1 Verify "Tasks" nav item navigates to the task list page
- [x] 7.2 Verify "Tasks" section label and separator appear in the sidebar regardless of task count
- [x] 7.3 Verify creating a standalone task with custom start/end times shows it as a calendar block at the correct time
- [x] 7.4 Verify task table shows all tasks and correct column values
- [x] 7.5 Verify status filter hides/shows tasks correctly
- [x] 7.6 Verify sorting by Title and Date works (asc and desc)
- [x] 7.7 Verify clicking a row opens the detail dialog with correct task data
- [x] 7.8 Verify document links in the dialog open in a new tab
- [x] 7.9 Verify Edit button in dialog opens `TaskFormModal` pre-filled with the task
