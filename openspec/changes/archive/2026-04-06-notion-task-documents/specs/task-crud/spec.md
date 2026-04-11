## MODIFIED Requirements

### Requirement: List tasks endpoint
The system SHALL provide `GET /api/tasks` (auth-required) that returns all tasks as `Task[]` enriched with `totalSeconds`, `activeSessionId`, and `documents`. An optional `?status=` query param filters by status. Results are ordered by `created_at DESC`. The `documents` field MUST be populated from `task_documents` joined with `documents` and MUST NOT be `[]` when documents are attached.

#### Scenario: List all tasks
- **WHEN** an authenticated client calls `GET /api/tasks`
- **THEN** the system returns `200` with all tasks, each including `totalSeconds`, `activeSessionId`, and `documents`

#### Scenario: Filter by status
- **WHEN** a client calls `GET /api/tasks?status=in_progress`
- **THEN** the system returns only tasks with `status = 'in_progress'`

#### Scenario: Task with documents
- **WHEN** a task has one or more Notion documents attached
- **THEN** the task's `documents` array includes each document with `id`, `provider`, `providerDocId`, `title`, and `url`

#### Scenario: Unauthenticated request
- **WHEN** a client calls `GET /api/tasks` without a valid session
- **THEN** the system returns `401`
