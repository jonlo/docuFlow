## MODIFIED Requirements

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

## MODIFIED Requirements

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
