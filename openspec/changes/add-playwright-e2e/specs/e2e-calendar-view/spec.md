## ADDED Requirements

### Requirement: Authenticated user sees calendar with Google events
The system SHALL render the calendar view with the authenticated user's Google Calendar events after login.

#### Scenario: Calendar view is shown after authentication
- **WHEN** an authenticated user navigates to the app root
- **THEN** the calendar component SHALL be visible on screen

#### Scenario: At least one synced event appears on the calendar
- **WHEN** the authenticated test account has events in the current week on Google Calendar
- **THEN** at least one event SHALL be rendered as a visible block on the calendar grid

#### Scenario: Event title is displayed on the calendar block
- **WHEN** a Google Calendar event is rendered on the calendar
- **THEN** the event block SHALL display the event's title text

### Requirement: User can navigate between calendar weeks
The system SHALL allow the user to move forward and backward through weeks using navigation controls.

#### Scenario: Clicking "next week" advances the calendar
- **WHEN** user clicks the next-week navigation button
- **THEN** the calendar SHALL display the following week's date range in the header

#### Scenario: Clicking "previous week" goes back
- **WHEN** user clicks the previous-week navigation button
- **THEN** the calendar SHALL display the previous week's date range in the header

#### Scenario: Clicking "today" returns to the current week
- **WHEN** user has navigated away from the current week and clicks the "Today" button
- **THEN** the calendar SHALL display the current week
