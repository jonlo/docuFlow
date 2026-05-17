## ADDED Requirements

### Requirement: User can create an independent task
The system SHALL allow an authenticated user to create a task not linked to any calendar event, with the task appearing as a block on the calendar.

#### Scenario: Task creation form opens
- **WHEN** user clicks the "New Task" button
- **THEN** a task creation form or panel SHALL appear with fields for title, start time, and end time

#### Scenario: Independent task is saved and shown on calendar
- **WHEN** user fills in a task title, start time, and end time and submits the form
- **THEN** the task SHALL appear as a visible block on the calendar at the specified time slot

### Requirement: User can create a task linked to a calendar event
The system SHALL allow an authenticated user to create a task linked to an existing calendar event, with the task inheriting the event's time slot.

#### Scenario: Task linked to event is saved
- **WHEN** user opens a calendar event and clicks "Add Task"
- **THEN** a task creation form SHALL appear pre-filled with the event's time range

#### Scenario: Event-linked task appears in the event detail
- **WHEN** an event-linked task is saved
- **THEN** the task SHALL be visible in the event's detail panel

### Requirement: User can edit an existing task
The system SHALL allow an authenticated user to edit the title and time of an existing task.

#### Scenario: Task edit form opens from calendar block
- **WHEN** user clicks an existing task block on the calendar
- **THEN** a task edit form SHALL appear populated with the task's current data

#### Scenario: Edited task title is reflected on the calendar
- **WHEN** user updates the task title and saves
- **THEN** the calendar block SHALL display the updated title

### Requirement: User can delete a task
The system SHALL allow an authenticated user to delete a task, removing it from the calendar.

#### Scenario: Task is removed from calendar after deletion
- **WHEN** user opens a task and confirms deletion
- **THEN** the task block SHALL no longer appear on the calendar
