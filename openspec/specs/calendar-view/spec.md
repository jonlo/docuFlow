## ADDED Requirements

### Requirement: AuthGate guards the calendar view
The system SHALL render an `AuthGate` component that checks `GET /api/auth/status` on mount. If the user is not authenticated, it MUST show a "Connect Google Calendar" button. If authenticated, it MUST render its children (the calendar view).

#### Scenario: User is not authenticated
- **WHEN** the app loads and `/api/auth/status` returns `{ "authenticated": false }`
- **THEN** the `AuthGate` renders a "Connect Google Calendar" button and does not render the calendar

#### Scenario: User is authenticated
- **WHEN** the app loads and `/api/auth/status` returns `{ "authenticated": true }`
- **THEN** the `AuthGate` renders its children (the `CalendarView` component)

#### Scenario: Auth status is loading
- **WHEN** the `/api/auth/status` request is in-flight
- **THEN** the `AuthGate` renders a loading indicator and neither the button nor the calendar

### Requirement: OAuth popup flow initiated from AuthGate
The system SHALL open the Google consent URL in a popup window when the user clicks "Connect Google Calendar". The popup MUST be opened via `window.open` (not a redirect). The `AuthGate` MUST poll `GET /api/auth/status` every 2 seconds while the popup is open and close the popup automatically when authentication succeeds.

#### Scenario: User clicks connect button
- **WHEN** the user clicks "Connect Google Calendar"
- **THEN** the frontend calls `GET /api/auth/google/url` to retrieve the consent URL
- **THEN** the frontend opens the URL in a popup via `window.open`
- **THEN** polling of `GET /api/auth/status` begins at 2-second intervals

#### Scenario: Authentication completes in popup
- **WHEN** the polling detects `{ "authenticated": true }`
- **THEN** the popup is closed programmatically
- **THEN** polling stops
- **THEN** the `AuthGate` transitions to showing the calendar view

#### Scenario: User closes popup manually before completing auth
- **WHEN** the user closes the popup window without completing OAuth
- **THEN** polling stops
- **THEN** the "Connect Google Calendar" button remains visible

### Requirement: CalendarView displays synced events
The system SHALL render a `CalendarView` component using `react-big-calendar` that fetches events from `GET /api/events` via TanStack Query and displays them on the calendar. The component MUST support month, week, and day view switching via a compact view switcher rendered above the calendar (not in the sidebar). The component MUST be `selectable` — clicking an empty cell or dragging a time range MUST call `onSelectSlot` which opens the `EventFormModal` in create mode with the slot pre-filled. Clicking an existing event MUST call `onSelectEvent` which opens the `EventFormModal` in edit mode. Event blocks MUST render with pastel fill backgrounds, a colored left border accent, rounded corners, the event title at font-weight 500, and a time sub-label below the title. The calendar grid MUST use the light lavender-gray design system: white column backgrounds, `#E2E2EE` grid lines, `#6B6B8A` time gutter labels, and a `#6B5ECD` current-time indicator line. The today column MUST have a subtly warmer background (`#EAE8F8`). The component MUST be wrapped in a `div.flowdocs-calendar` to scope rbc CSS overrides.

#### Scenario: Events are loaded and displayed
- **WHEN** `GET /api/events` returns a list of `CalendarEvent` objects
- **THEN** each event renders as a pastel block at its correct time position with a colored left border, rounded corners, title at weight 500, and time sub-label

#### Scenario: Event color assignment — no colorId
- **WHEN** an event has no `colorId`
- **THEN** the block renders with lavender family colors (bg `#E8E4FF`, border `#C4BAFF`)

#### Scenario: Event color assignment — colorId present
- **WHEN** an event has a `colorId`
- **THEN** the block renders with the corresponding pastel family color via the colorId-to-family lookup

#### Scenario: Today column highlight
- **WHEN** the week or day view is rendered and today is visible
- **THEN** the today column background is `#EAE8F8` (light purple tint), distinct from other columns

#### Scenario: Current time indicator
- **WHEN** the current time falls within the visible calendar range
- **THEN** a `#6B5ECD` horizontal line marks the current time in the time grid

#### Scenario: User clicks empty slot in month view
- **WHEN** the user clicks an empty day cell in month view
- **THEN** `onSelectSlot` fires and the `EventFormModal` opens in create mode with the date pre-filled

#### Scenario: User drags a time range in week/day view
- **WHEN** the user clicks and drags a time range in week or day view
- **THEN** `onSelectSlot` fires and the `EventFormModal` opens in create mode with start and end pre-filled

#### Scenario: User clicks an existing event
- **WHEN** the user clicks an event block
- **THEN** `onSelectEvent` fires and the `EventFormModal` opens in edit mode with the event's fields pre-populated

#### Scenario: Events are loading
- **WHEN** the `GET /api/events` request is in-flight
- **THEN** the calendar renders a loading state (skeleton or spinner)

#### Scenario: No events returned
- **WHEN** `GET /api/events` returns an empty array
- **THEN** the calendar renders with no event blocks and no error

#### Scenario: Events fetch fails
- **WHEN** `GET /api/events` returns a non-2xx response or a network error occurs
- **THEN** the calendar renders an inline error message with a retry button

#### Scenario: Session expired during calendar view
- **WHEN** `GET /api/events` returns `401`
- **THEN** the `AuthGate` invalidates the auth status query and transitions back to showing the "Connect Google Calendar" button

#### Scenario: User switches calendar view
- **WHEN** the user clicks the month, week, or day toggle in the view switcher above the calendar
- **THEN** the calendar re-renders in the selected view without re-fetching events

### Requirement: Shared CalendarEvent and AuthStatus types
The system SHALL define `CalendarEvent` and `AuthStatus` TypeScript types in `packages/shared/src/index.ts`. These types MUST be imported by both `packages/api` and `packages/web` — no inline type duplication is permitted.

#### Scenario: CalendarEvent type usage
- **WHEN** `packages/api` serializes events for `GET /api/events`
- **THEN** the response shape satisfies the `CalendarEvent` type from `packages/shared`

#### Scenario: AuthStatus type usage
- **WHEN** `packages/api` responds to `GET /api/auth/status`
- **THEN** the response shape satisfies the `AuthStatus` type from `packages/shared`
