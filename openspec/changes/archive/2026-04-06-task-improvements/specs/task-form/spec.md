## ADDED Requirements

### Requirement: Date/time pickers for standalone tasks in TaskFormModal
The `TaskFormModal` SHALL display `start` and `end` datetime pickers when the task has no linked event (`eventId` is absent). In create mode the pickers MUST default to the current hour (rounded down) and one hour later respectively. In edit mode they MUST be pre-filled from the existing task's `start` and `end`. The pickers MUST be hidden when a linked event is present. The `start` and `end` values MUST be included in the `POST /api/tasks` or `PATCH /api/tasks/:id` body.

#### Scenario: Standalone task create — pickers visible
- **WHEN** the modal opens in create mode with no `eventId`
- **THEN** start and end datetime pickers are shown, defaulting to now and now+1h

#### Scenario: Event-linked task — pickers hidden
- **WHEN** the modal opens with a pre-linked `eventId`
- **THEN** no date/time pickers are shown

#### Scenario: Edit standalone task — pickers pre-filled
- **WHEN** the modal opens in edit mode for a task with no linked event
- **THEN** the start and end pickers show the task's existing start and end values

#### Scenario: Submit with start after end
- **WHEN** the user sets start to a time after end and submits
- **THEN** an inline validation error is shown and the form does not submit
