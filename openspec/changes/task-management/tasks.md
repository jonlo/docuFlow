## 1. Schema & Shared Types

- [x] 1.1 Add `task_sessions` table to `packages/api/schema.sql` (`id`, `task_id FK`, `started_at`, `ended_at`, `created_at`, index on `task_id`)
- [x] 1.2 Apply migration locally: `wrangler d1 execute flowdocs-db --local --file=packages/api/schema.sql`
- [x] 1.3 Add `TaskSession` type to `packages/shared/src/index.ts`: `{ id, taskId, startedAt, endedAt?: string }`
- [x] 1.4 Add `totalSeconds: number` and `activeSessionId: string | null` fields to `Task` in `packages/shared/src/index.ts`
- [x] 1.5 Add `CreateTaskSessionBody` (empty) and no extra body types needed — sessions are created with no body

## 2. Backend — Task CRUD

- [x] 2.1 Create `packages/api/src/routes/tasks.ts` with `GET /api/tasks` — query D1, compute `totalSeconds` and `activeSessionId` per task via a JOIN on `task_sessions`, return `Task[]`
- [x] 2.2 Add `POST /api/tasks` to tasks router — validate title, default `start/end` when no `eventId`, insert, return 201 with enriched task
- [x] 2.3 Add `PATCH /api/tasks/:id` to tasks router — update allowed fields (title, status, description), return updated enriched task or 404
- [x] 2.4 Add `DELETE /api/tasks/:id` to tasks router — delete task (CASCADE removes sessions), return 204 or 404
- [x] 2.5 Mount tasks router in `packages/api/src/index.ts` at `/api/tasks`

## 3. Backend — Time Tracking

- [x] 3.1 Add `POST /api/tasks/:id/sessions` to tasks router — check for open session (409 if exists), insert new session with `started_at = now`, return updated enriched task (201)
- [x] 3.2 Add `PATCH /api/tasks/:id/sessions/:sessionId` to tasks router — set `ended_at = now`, validate session belongs to task, 409 if already ended, return updated enriched task

## 4. Frontend — Shared Types & Query Hooks

- [x] 4.1 Create `packages/web/src/hooks/useTasks.ts` — `useQuery<Task[]>` for `GET /api/tasks`, queryKey `["tasks"]`, staleTime 30s; overload for `GET /api/tasks?status=in_progress` with queryKey `["tasks", "in_progress"]`
- [x] 4.2 Create `packages/web/src/hooks/useTaskMutations.ts` — `useCreateTask`, `useUpdateTask`, `useDeleteTask` mutations, each invalidates `["tasks"]` on success
- [x] 4.3 Add `useStartTimer` and `usePauseTimer` mutations to `useTaskMutations.ts` — POST/PATCH sessions endpoints, invalidate `["tasks"]` on success

## 5. Frontend — Store

- [x] 5.1 Add `taskModal: { open: boolean; mode: "create" | "edit"; taskId?: string; initialData?: { eventId?: string; title?: string; status?: string } }` to `appStore.ts`
- [x] 5.2 Add `openTaskModal(mode, initialData?)` and `closeTaskModal()` actions to appStore

## 6. Frontend — TaskFormModal

- [x] 6.1 Create `packages/web/src/tasks/TaskFormModal.tsx` — reads `taskModal` from appStore, renders nothing when closed
- [x] 6.2 Add backdrop (fixed inset, `bg-black/30`), Escape key listener, and ✕ close button
- [x] 6.3 Add title text input (required, inline error if empty on submit)
- [x] 6.4 Add status selector: three buttons/tabs for `waiting`, `in_progress`, `completed`
- [x] 6.5 Show read-only linked-event chip when `initialData.eventId` is set (fetch event title from `["calendarEvents"]` cache)
- [x] 6.6 Wire submit: call `useCreateTask` or `useUpdateTask`, close modal on success, show inline error on failure
- [x] 6.7 In edit mode, add delete button with confirmation step (calls `useDeleteTask`, closes modal)

## 7. Frontend — Sidebar

- [x] 7.1 Replace "New Event" button in `Sidebar.tsx` with a "New" button that toggles an inline picker dropdown
- [x] 7.2 Add "Event" option to picker — calls `openEventModal("create")` and closes picker
- [x] 7.3 Add "Task" option to picker — calls `openTaskModal("create")` and closes picker
- [x] 7.4 Close picker on outside click (click-outside ref) and on Escape key
- [x] 7.5 Add in-progress tasks section below Calendar nav item using `useTasks({ status: "in_progress" })`
- [x] 7.6 Render each in-progress task row: title + elapsed time counter (`HH:MM:SS`) + start/pause toggle button
- [x] 7.7 Implement live elapsed counter: `useEffect` interval (1s) seeded from `task.totalSeconds`, paused when `activeSessionId` is null
- [x] 7.8 Wire start/pause button: call `useStartTimer` or `usePauseTimer` depending on `activeSessionId`

## 8. Frontend — EventDetailModal

- [x] 8.1 Add "Create Task" button to footer of `EventDetailModal.tsx`
- [x] 8.2 Wire button: `closeDetailModal()` then `openTaskModal("create", { eventId: event.id })`

## 9. Frontend — Render TaskFormModal

- [x] 9.1 Import and render `<TaskFormModal />` in `App.tsx` (or `CalendarView.tsx`) so it is always mounted

## 10. Validation

- [x] 10.1 Verify task creation from "New → Task" with no event link
- [x] 10.2 Verify task creation from EventDetailModal pre-links the event
- [x] 10.3 Verify in-progress tasks appear in sidebar after status set to `in_progress`
- [x] 10.4 Verify start timer creates a session and counter increments live
- [x] 10.5 Verify pause timer ends the session and counter stops
- [x] 10.6 Verify total elapsed time persists across pause/resume cycles
- [x] 10.7 Verify task status update (waiting → in_progress → completed) works from edit form
