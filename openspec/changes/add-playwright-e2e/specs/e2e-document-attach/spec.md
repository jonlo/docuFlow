## ADDED Requirements

### Requirement: User can search for and attach a Notion document to a task
The system SHALL allow an authenticated user with a configured Notion integration token to search Notion pages and attach one to an existing task.

#### Scenario: Document search input is visible on task panel
- **WHEN** user opens an existing task in the task panel
- **THEN** a document search input or "Attach document" control SHALL be visible

#### Scenario: Notion search returns results
- **WHEN** user types a search query into the document search input with Notion selected as the provider
- **THEN** a list of matching Notion pages SHALL be displayed as selectable options

#### Scenario: Selected Notion document appears on the task
- **WHEN** user selects a Notion page from the search results
- **THEN** the document SHALL appear as a linked item in the task panel with the page title visible

### Requirement: User can search for and attach a Confluence document to a task
The system SHALL allow an authenticated user with configured Confluence credentials to search Confluence pages and attach one to an existing task.

#### Scenario: Confluence search returns results
- **WHEN** user types a search query with Confluence selected as the provider
- **THEN** a list of matching Confluence pages SHALL be displayed as selectable options

#### Scenario: Selected Confluence document appears on the task
- **WHEN** user selects a Confluence page from the search results
- **THEN** the document SHALL appear as a linked item in the task panel with the page title visible

### Requirement: User can remove an attached document from a task
The system SHALL allow a user to unlink a previously attached document from a task.

#### Scenario: Removing a document unlinks it from the task
- **WHEN** user clicks the remove/unlink action on an attached document
- **THEN** the document SHALL no longer appear in the task panel
