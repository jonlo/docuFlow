## Why

FlowDocs is a productivity app and the calendar view is only half the picture — users need tasks that connect to their events and their work sessions. Adding tasks with status tracking and built-in time measurement closes the loop between planning (calendar) and execution (tasks).

## What Changes

- "New Event" button in the sidebar becomes a **"New" button** that opens a picker: "Event" or "Task"
- New **task create/edit form** (modal): title, status (in_progress / waiting / completed), optional linked event
- Tasks created from the **EventDetailModal** edit view are pre-linked to that event
- **In-progress tasks** listed in the sidebar below the Calendar nav item, with a start/pause timer button per task
- **Time tracking** per task: each work session is recorded with a start and optional end timestamp; the total elapsed time is always visible on the task
- Task statuses: `in_progress`, `waiting`, `completed`
- Task creation entry points: "New" button picker, EventDetailModal (task tab or button)

## Capabilities

### New Capabilities
- `task-crud`: Create, read, update, delete tasks — API endpoints and D1 storage
- `task-time-tracking`: Start/pause timer on a task; stores work sessions; shows total elapsed time
- `task-sidebar-list`: Sidebar section showing in-progress tasks with their timers
- `task-form`: Modal form for creating and editing tasks (title, status, linked event)

### Modified Capabilities
- `event-detail-view`: Add a "Create Task" button to the EventDetailModal that opens the task form pre-linked to the event
- `calendar-view`: "New Event" sidebar button becomes a "New" button with Event / Task picker

## Impact

- **New API routes**: `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`, `POST /api/tasks/:id/sessions` (start), `PATCH /api/tasks/:id/sessions/:sessionId` (end/pause)
- **D1 schema**: `tasks` table already exists in schema.sql; add `task_sessions` table (`id`, `task_id`, `started_at`, `ended_at`)
- **New frontend**: `TaskFormModal`, `TaskSidebarList`, timer hook `useTaskTimer`
- **Shared types**: `Task`, `TaskSession`, `CreateTaskBody`, `UpdateTaskBody` in `@flowdocs/shared`
- **Modified**: `Sidebar.tsx` (New button), `EventDetailModal.tsx` (Create Task button), `appStore.ts` (task modal state)
