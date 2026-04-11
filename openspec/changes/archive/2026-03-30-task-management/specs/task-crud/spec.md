## ADDED Requirements

### Requirement: List tasks endpoint
The system SHALL provide `GET /api/tasks` (auth-required) that returns all tasks as `Task[]` enriched with `totalSeconds` and `activeSessionId`. An optional `?status=` query param filters by status. Results are ordered by `created_at DESC`.

#### Scenario: List all tasks
- **WHEN** an authenticated client calls `GET /api/tasks`
- **THEN** the system returns `200` with all tasks, each including `totalSeconds` and `activeSessionId`

#### Scenario: Filter by status
- **WHEN** a client calls `GET /api/tasks?status=in_progress`
- **THEN** the system returns only tasks with `status = 'in_progress'`

#### Scenario: Unauthenticated request
- **WHEN** a client calls `GET /api/tasks` without a valid session
- **THEN** the system returns `401`

### Requirement: Create task endpoint
The system SHALL provide `POST /api/tasks` (auth-required) that accepts `CreateTaskBody` and inserts a new task into D1. When `eventId` is omitted the system MUST default `start` to the current time and `end` to one hour later to satisfy the DB constraint.

#### Scenario: Create task linked to event
- **WHEN** a client posts `{ title: "Review notes", eventId: "<id>" }`
- **THEN** the system inserts the task with the given `eventId` and returns `201` with the created task

#### Scenario: Create standalone task
- **WHEN** a client posts `{ title: "Prepare slides" }` without `eventId`
- **THEN** the system inserts the task with `start = now`, `end = now + 1h` and returns `201`

#### Scenario: Missing title
- **WHEN** a client posts a body with no `title`
- **THEN** the system returns `400` with `{ code: "BAD_REQUEST" }`

### Requirement: Update task endpoint
The system SHALL provide `PATCH /api/tasks/:id` (auth-required) that accepts `UpdateTaskBody` and updates the specified task. Returns the updated task with `totalSeconds` and `activeSessionId`.

#### Scenario: Update task status
- **WHEN** a client patches `{ status: "completed" }`
- **THEN** the system updates the task status and returns `200` with the updated task

#### Scenario: Task not found
- **WHEN** the task `id` does not exist
- **THEN** the system returns `404` with `{ code: "NOT_FOUND" }`

### Requirement: Delete task endpoint
The system SHALL provide `DELETE /api/tasks/:id` (auth-required) that removes the task and all its sessions (via CASCADE). Returns `204`.

#### Scenario: Successful deletion
- **WHEN** a client deletes an existing task
- **THEN** the system removes the task and returns `204`

#### Scenario: Task not found
- **WHEN** the task `id` does not exist
- **THEN** the system returns `404` with `{ code: "NOT_FOUND" }`
