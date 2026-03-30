## MODIFIED Requirements

### Requirement: EventFormModal fields
The `EventFormModal` SHALL contain the following fields: title (text, required), date (date picker), start time (time picker), end time (time picker), attendees (multi-input with contact search and free-form email fallback), and labels (multi-select with search existing labels + inline create). The modal MUST validate that title is non-empty and end time is after start time before allowing submission.

#### Scenario: Form opens in create mode
- **WHEN** the modal opens in create mode
- **THEN** title is empty, date/time fields are pre-filled from the triggering action, attendees list is empty, and labels list is empty

#### Scenario: Form opens in edit mode
- **WHEN** the modal opens in edit mode for an existing event
- **THEN** all fields are pre-populated with the event's current values including its assigned labels as chips

#### Scenario: Submitting with empty title
- **WHEN** the user attempts to submit with an empty title
- **THEN** the form shows an inline validation error and does not submit

#### Scenario: Submitting with end time before start time
- **WHEN** the user sets end time to before start time and attempts to submit
- **THEN** the form shows an inline validation error and does not submit

## ADDED Requirements

### Requirement: Label input in EventFormModal
The `EventFormModal` SHALL include a label multi-select field that queries existing labels as the user types (filtered client-side from the cached label list). Selecting a label adds it as a coloured chip. If the typed name does not match any existing label the dropdown MUST show a "Create label '<name>'" option. Selecting the create option MUST show an inline colour palette (8 preset colours) and immediately call `POST /api/labels` on confirmation before adding the new label as a chip.

#### Scenario: User searches for an existing label
- **WHEN** the user types in the label field
- **THEN** matching labels from the cached list appear as a dropdown with their colour swatches

#### Scenario: User selects an existing label
- **WHEN** the user clicks a label in the dropdown
- **THEN** the label is added as a coloured chip
- **THEN** the input is cleared

#### Scenario: User creates a new label inline
- **WHEN** the typed name matches no existing label
- **THEN** a "Create label '<name>'" option appears at the bottom of the dropdown
- **WHEN** the user selects the create option
- **THEN** an inline colour picker (8 presets) appears
- **WHEN** the user picks a colour and confirms
- **THEN** `POST /api/labels` is called and the new label is added as a chip

#### Scenario: User removes a label chip
- **WHEN** the user clicks the × on a label chip
- **THEN** the label is removed from the selection

### Requirement: Label assignment on event save
When the EventFormModal is submitted (create or edit), the selected labels MUST be applied to the event via `PUT /api/events/:id/labels` after the event has been created or updated. The `calendarEvents` query MUST be invalidated so label chips appear on the calendar without a manual refresh.

#### Scenario: Creating an event with labels
- **WHEN** the user submits the create form with one or more labels selected
- **THEN** the event is created via `POST /api/events`
- **THEN** labels are set via `PUT /api/events/:id/labels`
- **THEN** the `calendarEvents` query is invalidated and the event appears on the calendar with its label chips

#### Scenario: Editing an event's labels
- **WHEN** the user changes the label selection in edit mode and submits
- **THEN** the event is updated via `PATCH /api/events/:id`
- **THEN** the updated label set is applied via `PUT /api/events/:id/labels`
- **THEN** the calendar refreshes showing the updated chips
