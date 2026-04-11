## ADDED Requirements

### Requirement: In-progress tasks in sidebar
The sidebar SHALL display a list of all `in_progress` tasks below the Calendar nav item. Each row MUST show the task title, a live elapsed-time counter (`HH:MM:SS`), and a start/pause toggle button. The list MUST refresh from `GET /api/tasks?status=in_progress` with a 30-second stale time.

#### Scenario: No in-progress tasks
- **WHEN** no tasks have status `in_progress`
- **THEN** the sidebar section is empty (no heading shown)

#### Scenario: In-progress tasks exist
- **WHEN** one or more tasks have status `in_progress`
- **THEN** each task appears in the sidebar with its title and elapsed time counter

#### Scenario: Live elapsed time counter
- **WHEN** a task has an active session (timer running)
- **THEN** the elapsed time counter increments every second in the UI, seeded from `totalSeconds` returned by the API

#### Scenario: Timer is paused
- **WHEN** a task has no active session
- **THEN** the elapsed time counter shows the last accumulated `totalSeconds` and does not increment

### Requirement: Start/pause timer from sidebar
Each in-progress task row in the sidebar SHALL have a start/pause button. Clicking it MUST call `POST /api/tasks/:id/sessions` (if no active session) or `PATCH /api/tasks/:id/sessions/:sessionId` (if active). On success the task row MUST update immediately.

#### Scenario: User starts timer
- **WHEN** the task has no active session and the user clicks the start button
- **THEN** `POST /api/tasks/:id/sessions` is called
- **THEN** the button changes to a pause icon and the counter starts incrementing

#### Scenario: User pauses timer
- **WHEN** the task has an active session and the user clicks the pause button
- **THEN** `PATCH /api/tasks/:id/sessions/:sessionId` is called
- **THEN** the button changes to a start icon and the counter stops
