## ADDED Requirements

### Requirement: New Event button in sidebar
The sidebar SHALL display a primary "New Event" button. Clicking it MUST open the `EventFormModal` in create mode with no pre-filled date or time.

#### Scenario: User clicks New Event
- **WHEN** the user clicks the "New Event" button in the sidebar
- **THEN** the `EventFormModal` opens in create mode with an empty form

### Requirement: Click on empty month cell to create
The calendar in month view SHALL be selectable. Clicking an empty day cell MUST open the `EventFormModal` in create mode with the clicked date pre-filled and time defaulting to the next round hour.

#### Scenario: User clicks empty day in month view
- **WHEN** the user clicks an empty cell on a day in month view
- **THEN** the `EventFormModal` opens in create mode with the date field set to the clicked day
- **THEN** start time defaults to the next round hour and end time defaults to one hour after start

### Requirement: Click and drag on week/day view to create
The calendar in week and day view SHALL support click-and-drag slot selection. Releasing the drag MUST open the `EventFormModal` in create mode with the dragged start and end times pre-filled.

#### Scenario: User drags a time range in week view
- **WHEN** the user clicks and drags across a time range in week or day view
- **THEN** the `EventFormModal` opens in create mode with the start and end times pre-filled from the drag selection

#### Scenario: User single-clicks a time slot in week/day view
- **WHEN** the user clicks a single time slot in week or day view without dragging
- **THEN** the `EventFormModal` opens in create mode with the clicked time as start and start + 1 hour as end
