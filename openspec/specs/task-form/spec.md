## ADDED Requirements

### Requirement: TaskFormModal fields and behaviour
The system SHALL provide a `TaskFormModal` component with: title (text, required), status selector (`in_progress` / `waiting` / `completed`), and a read-only linked-event display (shown when the task was opened with a pre-linked `eventId`). The modal MUST validate that title is non-empty before submission. On submit it calls `POST /api/tasks` (create) or `PATCH /api/tasks/:id` (edit) and invalidates the `["tasks"]` query on success.

#### Scenario: Create mode — empty form
- **WHEN** the modal opens in create mode without a linked event
- **THEN** the title is empty and status defaults to `waiting`

#### Scenario: Create mode — pre-linked event
- **WHEN** the modal opens with a pre-linked `eventId`
- **THEN** the linked event name is shown as a read-only chip

#### Scenario: Edit mode — pre-populated
- **WHEN** the modal opens in edit mode for an existing task
- **THEN** title and status are pre-filled from the task data

#### Scenario: Submit with empty title
- **WHEN** the user submits with no title
- **THEN** an inline validation error is shown and the form does not submit

#### Scenario: Successful create
- **WHEN** the user fills in a title and submits in create mode
- **THEN** `POST /api/tasks` is called and the modal closes on success

#### Scenario: Successful edit
- **WHEN** the user changes the status and submits in edit mode
- **THEN** `PATCH /api/tasks/:id` is called and the modal closes on success

### Requirement: Document search and attach in TaskFormModal
The `TaskFormModal` SHALL include a provider picker (two tabs: `Notion` and `Confluence`) above the document search field. The active tab determines which backend is searched. Each tab MUST independently debounce input by 300 ms and call `GET /api/notion/search?q=` or `GET /api/confluence/search?q=` respectively when the trimmed query is at least 2 characters. If the selected provider is not configured, the search input MUST be replaced with a "Connect [Provider] first" message. Selecting a result MUST call `POST /api/tasks/:id/documents` with the correct `provider` value (edit mode) or queue the attachment for submission (create mode).

#### Scenario: Notion tab — search returns results
- **WHEN** the user selects the Notion tab and types at least 2 characters
- **THEN** after 300 ms a dropdown appears with matching Notion page titles

#### Scenario: Confluence tab — search returns results
- **WHEN** the user selects the Confluence tab and types at least 2 characters
- **THEN** after 300 ms a dropdown appears with matching Confluence page titles

#### Scenario: Notion not configured
- **WHEN** the user selects the Notion tab and Notion is not connected
- **THEN** the search input is replaced with "Connect Notion first"

#### Scenario: Confluence not configured
- **WHEN** the user selects the Confluence tab and Confluence is not connected
- **THEN** the search input is replaced with "Connect Confluence first"

#### Scenario: User selects Notion result (edit mode)
- **WHEN** the user clicks a Notion result in the dropdown while in edit mode
- **THEN** `POST /api/tasks/:id/documents` is called with `provider: "notion"` and the document appears in the attached list

#### Scenario: User selects Confluence result (edit mode)
- **WHEN** the user clicks a Confluence result in the dropdown while in edit mode
- **THEN** `POST /api/tasks/:id/documents` is called with `provider: "confluence"` and the document appears in the attached list

#### Scenario: Attach in create mode
- **WHEN** the user selects any result while in create mode
- **THEN** the document (with its provider) is queued and attached after the task is created

### Requirement: Attached documents list in TaskFormModal
The `TaskFormModal` SHALL render the list of documents currently attached to the task. Each row MUST show the document title as a clickable link, a provider badge (`Notion` or `Confluence`), and a detach (×) button. For `notion` documents, clicking the title MUST call `openDocumentPage` to open the in-app editor. For `confluence` documents, clicking the title MUST open the URL in a new browser tab. Clicking detach MUST call `DELETE /api/tasks/:id/documents/:documentId` and remove the row.

#### Scenario: Notion document link
- **WHEN** the user clicks a Notion document title in the attached list
- **THEN** `openDocumentPage` is called and the in-app editor overlay opens

#### Scenario: Confluence document link
- **WHEN** the user clicks a Confluence document title in the attached list
- **THEN** the Confluence page URL opens in a new browser tab

#### Scenario: Provider badge shown
- **WHEN** the task has documents from both providers
- **THEN** each document row shows a "Notion" or "Confluence" badge to distinguish them

#### Scenario: Detach document
- **WHEN** the user clicks the × button on an attached document
- **THEN** `DELETE /api/tasks/:id/documents/:documentId` is called and the row is removed

### Requirement: New button picker in sidebar
The sidebar "New Event" button SHALL be replaced with a "New" button. Clicking it MUST open a small picker with two options: "Event" (opens `EventFormModal` in create mode) and "Task" (opens `TaskFormModal` in create mode).

#### Scenario: User picks Event
- **WHEN** the user clicks "New" then "Event"
- **THEN** the `EventFormModal` opens in create mode

#### Scenario: User picks Task
- **WHEN** the user clicks "New" then "Task"
- **THEN** the `TaskFormModal` opens in create mode with no pre-linked event

### Requirement: Date/time pickers for standalone tasks in TaskFormModal
The `TaskFormModal` SHALL display `start` and `end` datetime pickers when the task has no linked event (`eventId` is absent). In create mode the pickers MUST default to the current hour (rounded down) and one hour later respectively. In edit mode they MUST be pre-filled from the existing task's `start` and `end`. The pickers MUST be hidden when a linked event is present. The `start` and `end` values MUST be included in the `POST /api/tasks` or `PATCH /api/tasks/:id` body.

#### Scenario: Standalone task create — pickers visible
- **WHEN** the modal opens in create mode with no `eventId`
- **THEN** start and end datetime pickers are shown, defaulting to now and now+1h

#### Scenario: Event-linked task — pickers hidden
- **WHEN** the modal opens with a pre-linked `eventId`
- **THEN** no date/time pickers are shown

#### Scenario: Edit standalone task — pickers pre-filled
- **WHEN** the modal opens in edit mode for a task with no linked event
- **THEN** the start and end pickers show the task's existing start and end values

#### Scenario: Submit with start after end
- **WHEN** the user sets start to a time after end and submits
- **THEN** an inline validation error is shown and the form does not submit
