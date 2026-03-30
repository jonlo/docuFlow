## ADDED Requirements

### Requirement: EventDetailModal displays event information read-only
The system SHALL provide an `EventDetailModal` component that renders a compact, non-editable view of a calendar event. It MUST display the event title, start/end date and time, label chips (if any), attendees (if any), and description (if any). All fields MUST be read-only — no inputs or editable elements. The modal MUST be smaller than the `EventFormModal` (max width 384px, auto height).

#### Scenario: Modal opens with event data
- **WHEN** a user clicks a calendar event
- **THEN** the `EventDetailModal` opens displaying the event title, formatted date and time, label chips, and attendees

#### Scenario: Event has no labels or attendees
- **WHEN** the event has no labels or attendees
- **THEN** those sections are not rendered (no empty rows)

#### Scenario: Event has a description
- **WHEN** the event has a non-empty description field
- **THEN** the description is rendered as read-only text below the other fields

#### Scenario: User closes the modal
- **WHEN** the user clicks the ✕ button or clicks the backdrop
- **THEN** the modal closes and the calendar is shown unchanged

#### Scenario: User presses Escape
- **WHEN** the `EventDetailModal` is open and the user presses the Escape key
- **THEN** the modal closes

### Requirement: EventDetailModal edit action
The `EventDetailModal` header SHALL contain a pencil icon button. Clicking it MUST close the detail modal and immediately open the `EventFormModal` in edit mode, pre-populated with all current event field values including labels and attendees.

#### Scenario: User clicks the edit button
- **WHEN** the user clicks the pencil icon in the `EventDetailModal` header
- **THEN** the detail modal closes
- **THEN** the `EventFormModal` opens in edit mode with the event's title, start, end, attendees, and labels pre-populated
