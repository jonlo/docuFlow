## ADDED Requirements

### Requirement: Start timer session
The system SHALL provide `POST /api/tasks/:id/sessions` (auth-required) that creates a new `task_session` row with `started_at = now` and `ended_at = NULL`. Only one session per task MAY be open at a time — if an open session already exists the endpoint MUST return `409`.

#### Scenario: Start timer on a task
- **WHEN** a client posts to `POST /api/tasks/:id/sessions` and no open session exists
- **THEN** the system creates a session row with `started_at = now`, `ended_at = NULL`
- **THEN** the system returns `201` with the updated task including the new `activeSessionId` and updated `totalSeconds`

#### Scenario: Timer already running
- **WHEN** a client posts to `POST /api/tasks/:id/sessions` and an open session already exists
- **THEN** the system returns `409` with `{ code: "TIMER_ALREADY_RUNNING" }`

#### Scenario: Task not found
- **WHEN** the task `id` does not exist
- **THEN** the system returns `404` with `{ code: "NOT_FOUND" }`

### Requirement: End (pause) timer session
The system SHALL provide `PATCH /api/tasks/:id/sessions/:sessionId` (auth-required) that sets `ended_at = now` on the specified session. The session MUST belong to the given task.

#### Scenario: Pause a running timer
- **WHEN** a client patches an open session
- **THEN** the system sets `ended_at = now` on the session
- **THEN** the system returns `200` with the updated task including `activeSessionId: null` and updated `totalSeconds`

#### Scenario: Session already ended
- **WHEN** the session already has an `ended_at`
- **THEN** the system returns `409` with `{ code: "SESSION_ALREADY_ENDED" }`

#### Scenario: Session not found or wrong task
- **WHEN** the `sessionId` does not belong to the given `taskId`
- **THEN** the system returns `404` with `{ code: "NOT_FOUND" }`

### Requirement: Task response includes time data
Every `Task` returned by the API (`GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, session endpoints) SHALL include:
- `totalSeconds: number` — sum of all session durations; open sessions count duration up to now
- `activeSessionId: string | null` — the id of the currently open session, or null

#### Scenario: Task with completed sessions
- **WHEN** a task has two ended sessions of 600s and 400s
- **THEN** `totalSeconds` equals `1000`

#### Scenario: Task with an open session
- **WHEN** a task has one open session started 120 seconds ago
- **THEN** `totalSeconds` is approximately `120` (computed server-side at request time)
- **THEN** `activeSessionId` is the open session's id

#### Scenario: Task with no sessions
- **WHEN** a task has never been timed
- **THEN** `totalSeconds` equals `0` and `activeSessionId` is `null`
