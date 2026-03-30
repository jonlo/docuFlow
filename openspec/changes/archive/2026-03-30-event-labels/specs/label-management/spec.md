## ADDED Requirements

### Requirement: List labels endpoint
The system SHALL provide `GET /api/labels` (auth-required) that returns all labels as `Label[]` sorted by name ascending.

#### Scenario: Labels exist
- **WHEN** an authenticated client calls `GET /api/labels`
- **THEN** the system returns `200` with an array of `{ id, name, color }` objects sorted by name

#### Scenario: No labels exist
- **WHEN** no labels have been created
- **THEN** the system returns `200` with an empty array

#### Scenario: Unauthenticated request
- **WHEN** a client calls `GET /api/labels` without a valid session
- **THEN** the system returns `401`

### Requirement: Create label endpoint
The system SHALL provide `POST /api/labels` (auth-required) that accepts `{ name: string; color: string }` and inserts a new row into the `labels` table, returning the created `Label`.

#### Scenario: Successful creation
- **WHEN** an authenticated client calls `POST /api/labels` with `{ name: "Work", color: "#6B5ECD" }`
- **THEN** the system inserts the label into D1 and returns `201` with the created label including its generated `id`

#### Scenario: Duplicate name
- **WHEN** a label with the same name already exists
- **THEN** the system returns `409` with `{ error: "Label already exists", code: "LABEL_EXISTS" }`

#### Scenario: Missing required fields
- **WHEN** `name` or `color` is missing from the request body
- **THEN** the system returns `400` with `{ error: "Name and color are required", code: "BAD_REQUEST" }`

### Requirement: Delete label endpoint
The system SHALL provide `DELETE /api/labels/:id` (auth-required) that removes the label from D1. The `entity_labels` pivot rows are deleted automatically via the existing `ON DELETE CASCADE` FK constraint.

#### Scenario: Successful deletion
- **WHEN** an authenticated client calls `DELETE /api/labels/:id` with an existing id
- **THEN** the system deletes the label and all its `entity_labels` associations
- **THEN** the system returns `204` with no body

#### Scenario: Label not found
- **WHEN** no label with the given id exists
- **THEN** the system returns `404` with `{ error: "Label not found", code: "NOT_FOUND" }`

### Requirement: Config → Labels sidebar page
The sidebar SHALL contain a "Config" section with a "Labels" navigation item. Navigating to it MUST display a list of all labels (colour swatch + name) with a delete button per label, and a form to create a new label (name input + colour palette picker + submit button).

#### Scenario: User opens Labels page
- **WHEN** the user clicks "Labels" in the sidebar Config section
- **THEN** the main content area shows the Labels management page
- **THEN** all existing labels are listed with their colour swatches and names

#### Scenario: User creates a label from Labels page
- **WHEN** the user enters a name, selects a colour, and submits the create form
- **THEN** the label is created via `POST /api/labels`
- **THEN** the new label appears in the list immediately

#### Scenario: User deletes a label from Labels page
- **WHEN** the user clicks the delete button next to a label
- **THEN** the label is deleted via `DELETE /api/labels/:id`
- **THEN** the label disappears from the list immediately
