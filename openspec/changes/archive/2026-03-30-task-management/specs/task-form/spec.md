## ADDED Requirements

### Requirement: TaskFormModal fields and behaviour
The system SHALL provide a `TaskFormModal` component with: title (text, required), status selector (`in_progress` / `waiting` / `completed`), and a read-only linked-event display (shown when the task was opened with a pre-linked `eventId`). The modal MUST validate that title is non-empty before submission. On submit it calls `POST /api/tasks` (create) or `PATCH /api/tasks/:id` (edit) and invalidates the `["tasks"]` query on success.

#### Scenario: Create mode — empty form
- **WHEN** the modal opens in create mode without a linked event
- **THEN** the title is empty and status defaults to `waiting`

#### Scenario: Create mode — pre-linked event
- **WHEN** the modal opens with a pre-linked `eventId`
- **THEN** the linked event name is shown as a read-only chip

#### Scenario: Edit mode — pre-populated
- **WHEN** the modal opens in edit mode for an existing task
- **THEN** title and status are pre-filled from the task data

#### Scenario: Submit with empty title
- **WHEN** the user submits with no title
- **THEN** an inline validation error is shown and the form does not submit

#### Scenario: Successful create
- **WHEN** the user fills in a title and submits in create mode
- **THEN** `POST /api/tasks` is called and the modal closes on success

#### Scenario: Successful edit
- **WHEN** the user changes the status and submits in edit mode
- **THEN** `PATCH /api/tasks/:id` is called and the modal closes on success

### Requirement: New button picker in sidebar
The sidebar "New Event" button SHALL be replaced with a "New" button. Clicking it MUST open a small picker with two options: "Event" (opens `EventFormModal` in create mode) and "Task" (opens `TaskFormModal` in create mode).

#### Scenario: User picks Event
- **WHEN** the user clicks "New" then "Event"
- **THEN** the `EventFormModal` opens in create mode

#### Scenario: User picks Task
- **WHEN** the user clicks "New" then "Task"
- **THEN** the `TaskFormModal` opens in create mode with no pre-linked event
