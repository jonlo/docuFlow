## ADDED Requirements

### Requirement: EventFormModal fields
The `EventFormModal` SHALL contain the following fields: title (text, required), date (date picker), start time (time picker), end time (time picker), and attendees (multi-input with contact search and free-form email fallback). The modal MUST validate that title is non-empty and end time is after start time before allowing submission.

#### Scenario: Form opens in create mode
- **WHEN** the modal opens in create mode
- **THEN** title is empty, date/time fields are pre-filled from the triggering action, and attendees list is empty

#### Scenario: Form opens in edit mode
- **WHEN** the modal opens in edit mode for an existing event
- **THEN** all fields are pre-populated with the event's current values

#### Scenario: Submitting with empty title
- **WHEN** the user attempts to submit with an empty title
- **THEN** the form shows an inline validation error and does not submit

#### Scenario: Submitting with end time before start time
- **WHEN** the user sets end time to before start time and attempts to submit
- **THEN** the form shows an inline validation error and does not submit

### Requirement: Attendee input with Google Contacts lookup
The attendee field SHALL query `GET /api/contacts/search?q=<query>` as the user types (debounced 300ms) and display matching contacts (name + email) as suggestions. Selecting a suggestion adds the contact. If no match exists, the user MAY type a full email address and press Enter/comma to add it as a free-form attendee.

#### Scenario: User types a name in attendee field
- **WHEN** the user types 2+ characters in the attendee field
- **THEN** the system calls `/api/contacts/search` and shows up to 5 matching contacts as a dropdown

#### Scenario: User selects a contact suggestion
- **WHEN** the user clicks a contact suggestion
- **THEN** the contact is added as an attendee chip showing their name and email
- **THEN** the search input is cleared

#### Scenario: User adds a free-form email
- **WHEN** the user types a valid email address and presses Enter or comma
- **THEN** the email is added as an attendee chip
- **THEN** the search input is cleared

#### Scenario: User removes an attendee
- **WHEN** the user clicks the × on an attendee chip
- **THEN** the attendee is removed from the list

### Requirement: Create event submission
Submitting the form in create mode SHALL call `POST /api/events` with the form values, write the event to Google Calendar, upsert it into D1, invalidate the `calendarEvents` query, and close the modal.

#### Scenario: Successful create
- **WHEN** the user submits a valid create form
- **THEN** the event is created in Google Calendar
- **THEN** the event appears in D1 and on the calendar after query invalidation
- **THEN** the modal closes

#### Scenario: Create fails
- **WHEN** the Google Calendar API returns an error on create
- **THEN** the modal shows an inline error message and remains open

### Requirement: Edit event submission
Submitting the form in edit mode SHALL call `PATCH /api/events/:id` with the changed fields, update the event in Google Calendar and D1, invalidate the `calendarEvents` query, and close the modal.

#### Scenario: Successful edit
- **WHEN** the user submits a valid edit form
- **THEN** the event is updated in Google Calendar and D1
- **THEN** the updated event appears on the calendar after query invalidation
- **THEN** the modal closes

### Requirement: Delete event from modal
The `EventFormModal` in edit mode SHALL show a "Delete" button. Clicking it MUST show an inline confirmation step ("Delete this event?") with Confirm and Cancel options. Confirming SHALL call `DELETE /api/events/:id`, remove the event from Google Calendar and D1, invalidate the query, and close the modal.

#### Scenario: User initiates delete
- **WHEN** the user clicks the "Delete" button
- **THEN** an inline confirmation ("Delete this event? Confirm / Cancel") appears in the modal

#### Scenario: User confirms delete
- **WHEN** the user clicks "Confirm" on the delete confirmation
- **THEN** the event is deleted from Google Calendar and D1
- **THEN** the modal closes and the event disappears from the calendar

#### Scenario: User cancels delete
- **WHEN** the user clicks "Cancel" on the delete confirmation
- **THEN** the modal returns to the edit form with no changes made
