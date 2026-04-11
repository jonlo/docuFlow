## Context

The D1 schema already has a `tasks` table with `status CHECK('pending','in_progress','done','blocked')`, `event_id` FK, `priority`, `start`, `end`, and `created_by`. The shared types have `Task`, `CreateTaskBody`, `UpdateTaskBody`, and `TaskStatus`. There are no existing task API routes and no frontend task UI. This change wires up the full stack from D1 → API → frontend for the task CRUD and time-tracking features described in the proposal.

## Goals / Non-Goals

**Goals:**
- Task CRUD API (`GET`, `POST`, `PATCH`, `DELETE /api/tasks`)
- Time-tracking API: `POST /api/tasks/:id/sessions` (start), `PATCH /api/tasks/:id/sessions/:sessionId` (end/pause)
- Sidebar "New" button picker (Event | Task)
- `TaskFormModal` for creating/editing tasks (title, status, optional event link)
- Sidebar in-progress task list with live timer per task
- "Create Task" button in `EventDetailModal` pre-linking the task to that event
- Status values aligned to UX: `in_progress`, `waiting`, `completed` (mapped from existing DB values)

**Non-Goals:**
- Task document/link attachments (explicitly deferred)
- Drag-and-drop task rescheduling
- Task labels (deferred)
- Priority field exposed in UI (exists in DB, hidden for now)

## Decisions

### 1. Status value mapping

The DB CHECK uses `('pending','in_progress','done','blocked')`. The UI uses `in_progress`, `waiting`, `completed`. Map: `waiting → pending`, `completed → done`. `blocked` exists in DB but is not exposed in UI for now. This avoids a schema migration.

### 2. `task_sessions` is a new table

The existing schema has no time-tracking table. Add:
```sql
CREATE TABLE IF NOT EXISTS task_sessions (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  ended_at   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
Total elapsed time is computed on read: `SUM(strftime('%s', COALESCE(ended_at, datetime('now'))) - strftime('%s', started_at))`. An open session (`ended_at IS NULL`) means the timer is running.

### 3. Task returned with `totalSeconds` and `activeSessionId`

The API response enriches `Task` with:
- `totalSeconds: number` — sum of all session durations
- `activeSessionId: string | null` — id of the currently open session (if any)

This lets the frontend know whether to show "Start" or "Pause" without a separate request.

### 4. Timer state lives in TanStack Query, not Zustand

The sidebar polls `GET /api/tasks?status=in_progress` every 30s (staleTime 30s). When the user starts/pauses, the mutation invalidates the task list so the elapsed time re-renders from server data. No client-side tick interval needed for persistence — only a local `useEffect` interval drives the live display counter, seeded from `totalSeconds`.

### 5. `TaskFormModal` state in appStore

Add `taskModal: { open, mode, initialData, taskId }` alongside `eventModal` and `detailModal`. Opening from EventDetailModal passes `eventId` as initial data.

### 6. Independent tasks require start+end — hide for now

The DB CHECK requires `start` and `end` when `event_id IS NULL`. For the initial UI, when creating a standalone task (not linked to an event), default `start` to now and `end` to now+1h. These fields are not shown in the form yet (deferred UX).

## Risks / Trade-offs

- [Open session on tab close] If the user closes the tab with an active session, `ended_at` stays NULL forever → the task shows as "running" on next load. Mitigation: the "pause" action is explicit; a stale open session can be ended by the user clicking pause. A server-side session auto-close (cron) is deferred.
- [Status enum mismatch] DB has 4 values, UI shows 3. The mapping is documented here; adding `blocked` later is additive.

## Migration Plan

1. Apply `task_sessions` table migration via `wrangler d1 execute`:
   ```sql
   CREATE TABLE IF NOT EXISTS task_sessions ( ... );
   CREATE INDEX IF NOT EXISTS idx_task_sessions_task ON task_sessions(task_id);
   ```
2. No existing data to migrate (no tasks exist yet).
3. Update `schema.sql` to include the new table for future fresh setups.
