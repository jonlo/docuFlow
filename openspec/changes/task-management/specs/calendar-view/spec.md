## ADDED Requirements

### Requirement: Sidebar New button picker
The sidebar "New Event" button SHALL be replaced with a "New" button. Clicking it MUST reveal a small inline picker with two options: "Event" and "Task". Selecting "Event" opens `EventFormModal` in create mode. Selecting "Task" opens `TaskFormModal` in create mode. Clicking outside the picker or pressing Escape dismisses it without opening any modal.

#### Scenario: User opens the picker
- **WHEN** the user clicks the "New" button
- **THEN** a picker appears with "Event" and "Task" options

#### Scenario: User selects Event
- **WHEN** the user clicks "Event" in the picker
- **THEN** the picker closes and `EventFormModal` opens in create mode

#### Scenario: User selects Task
- **WHEN** the user clicks "Task" in the picker
- **THEN** the picker closes and `TaskFormModal` opens in create mode

#### Scenario: User dismisses picker
- **WHEN** the user clicks outside the picker or presses Escape
- **THEN** the picker closes without opening any modal
