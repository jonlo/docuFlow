## ADDED Requirements

### Requirement: Task list page
The system SHALL provide a `TaskListView` page accessible via a "Tasks" nav item in the sidebar. The page MUST display all tasks in a sortable, filterable table with columns: title, status, linked event (name or "—"), documents (count), and start date. The page MUST be reachable by setting `activePage` to `"tasks"` in the app store.

#### Scenario: Navigate to Tasks page
- **WHEN** the user clicks "Tasks" in the sidebar navigation
- **THEN** the main content area renders the `TaskListView` with all tasks

#### Scenario: Tasks table renders
- **WHEN** the `TaskListView` loads
- **THEN** all tasks are shown in a table, defaulting to sort by start date descending

#### Scenario: No tasks exist
- **WHEN** there are no tasks
- **THEN** the table shows an empty state message

### Requirement: Filter tasks by status
The task table SHALL include a segmented filter control with options: All, Waiting, In Progress, Completed. Selecting an option MUST immediately filter the visible rows to only tasks matching that status.

#### Scenario: Filter by status
- **WHEN** the user selects "In Progress" in the filter control
- **THEN** only tasks with status `in_progress` are shown in the table

#### Scenario: All filter selected
- **WHEN** the user selects "All"
- **THEN** all tasks are shown regardless of status

### Requirement: Sort tasks by column
The task table SHALL allow sorting by clicking the "Title" or "Date" column headers. Clicking a header MUST toggle between ascending and descending order. The active sort direction MUST be indicated by an arrow icon in the header.

#### Scenario: Sort by date ascending
- **WHEN** the user clicks the "Date" column header once (or it is the active sort)
- **THEN** tasks are sorted by start date ascending

#### Scenario: Sort by name descending
- **WHEN** the user clicks the "Title" column header twice
- **THEN** tasks are sorted alphabetically descending by title

### Requirement: Task detail dialog from table row
The task table SHALL open a read-only `TaskDetailDialog` when any row is clicked. The dialog MUST display: title, status, start and end date/time (if set), linked event name (if any), attached documents as clickable links, and an Edit button that opens `TaskFormModal` in edit mode.

#### Scenario: Row click opens dialog
- **WHEN** the user clicks a task row in the table
- **THEN** the `TaskDetailDialog` opens showing that task's details

#### Scenario: Document link in dialog
- **WHEN** the dialog shows attached documents
- **THEN** each document title is a link that opens the Notion URL in a new tab

#### Scenario: Edit from dialog
- **WHEN** the user clicks the Edit button in the dialog
- **THEN** the `TaskDetailDialog` closes and `TaskFormModal` opens in edit mode for that task

#### Scenario: Close dialog
- **WHEN** the user clicks outside the dialog or presses Escape
- **THEN** the dialog closes and the table is visible again
