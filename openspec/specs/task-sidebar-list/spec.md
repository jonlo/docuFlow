## ADDED Requirements

### Requirement: In-progress tasks in sidebar
The sidebar SHALL display a labelled "Tasks" section with a visual separator above the status accordion. The accordion SHALL show all tasks grouped by status (`in_progress`, waiting, completed). Each row MUST show the task title, a live elapsed-time counter (`HH:MM:SS`) for in-progress tasks, and action icons. The list MUST refresh from `GET /api/tasks` with a 30-second stale time. The sidebar navigation MUST include a "Reports" item below "Tasks" that sets `activePage` to `"reports"`.

#### Scenario: Section header always visible
- **WHEN** the sidebar renders
- **THEN** a "Tasks" heading and a horizontal separator are visible above the accordion, regardless of whether any tasks exist

#### Scenario: No tasks in a status group
- **WHEN** no tasks exist for a given status
- **THEN** that accordion section still renders its header but shows no task rows

#### Scenario: In-progress tasks exist
- **WHEN** one or more tasks have status `in_progress`
- **THEN** each task appears in the In Progress accordion section with its title and elapsed time counter

#### Scenario: Live elapsed time counter
- **WHEN** a task has an active session (timer running)
- **THEN** the elapsed time counter increments every second in the UI, seeded from `totalSeconds` returned by the API

#### Scenario: Timer is paused
- **WHEN** a task has no active session
- **THEN** the elapsed time counter shows the last accumulated `totalSeconds` and does not increment

#### Scenario: Navigate to Reports
- **WHEN** the user clicks "Reports" in the sidebar
- **THEN** `activePage` is set to `"reports"` and the Reports page renders

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
