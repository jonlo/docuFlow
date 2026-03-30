## ADDED Requirements

### Requirement: EventDetailModal create task action
The `EventDetailModal` SHALL include a "Create Task" button in the footer. Clicking it MUST close the detail modal and open the `TaskFormModal` in create mode with the event's `id` pre-linked.

#### Scenario: User clicks Create Task
- **WHEN** the user clicks the "Create Task" button in the `EventDetailModal`
- **THEN** the detail modal closes
- **THEN** the `TaskFormModal` opens in create mode with the event pre-linked (shown as a read-only chip)
