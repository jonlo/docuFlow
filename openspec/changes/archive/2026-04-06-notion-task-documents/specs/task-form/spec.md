## ADDED Requirements

### Requirement: Document search and attach in TaskFormModal
The `TaskFormModal` SHALL include a document search field below the status selector. It MUST debounce user input by 300 ms and call `GET /api/notion/search?q=<query>` when the trimmed query is at least 2 characters. Results MUST appear in a dropdown list showing the page title. Selecting a result MUST call `POST /api/tasks/:id/documents` (in edit mode) or queue the attachment for submission (in create mode). If Notion is not configured, the field MUST show a static "Connect Notion first" message instead of the search input.

#### Scenario: Search returns results
- **WHEN** the user types at least 2 characters in the document search field
- **THEN** after 300 ms a dropdown appears with matching Notion page titles

#### Scenario: User selects a search result (edit mode)
- **WHEN** the user clicks a result in the dropdown while in edit mode
- **THEN** `POST /api/tasks/:id/documents` is called and the document appears in the attached list

#### Scenario: User selects a search result (create mode)
- **WHEN** the user clicks a result in the dropdown while in create mode
- **THEN** the document is queued and attached after the task is created

#### Scenario: Notion not configured
- **WHEN** the user's Notion integration is not connected
- **THEN** the document search input is replaced with a "Connect Notion first" message

### Requirement: Attached documents list in TaskFormModal
The `TaskFormModal` SHALL render the list of documents currently attached to the task. Each row MUST show the document title as a clickable link that opens the Notion URL in a new tab, and a detach (×) button. Clicking detach MUST call `DELETE /api/tasks/:id/documents/:documentId` and remove the row from the list.

#### Scenario: Documents displayed
- **WHEN** the task has attached documents
- **THEN** each document title is shown as a link with a detach button

#### Scenario: Click document title
- **WHEN** the user clicks the document title link
- **THEN** the Notion page opens in a new browser tab

#### Scenario: Detach document
- **WHEN** the user clicks the × button on an attached document
- **THEN** `DELETE /api/tasks/:id/documents/:documentId` is called and the row is removed
