## ADDED Requirements

### Requirement: Attach document to task
The system SHALL provide `POST /api/tasks/:id/documents` (auth-required) that attaches a document to the specified task. The request body MUST contain `{ provider: "notion" | "confluence"; providerDocId: string; title: string; url: string }`. The `provider` field is required — requests without it MUST return `400 BAD_REQUEST`. The system MUST upsert the document into the `documents` table using `(provider, provider_doc_id)` as the unique key and then insert a row into `task_documents`. If the task does not exist, the system MUST return `404`. If the document is already attached to this task, the system MUST return `409`.

#### Scenario: Successful attach — Notion
- **WHEN** a client posts `{ provider: "notion", providerDocId: "abc", title: "My Page", url: "https://notion.so/..." }` to `/api/tasks/:id/documents`
- **THEN** the system upserts the document with `provider = "notion"` and links it to the task, returning `201` with the updated task

#### Scenario: Successful attach — Confluence
- **WHEN** a client posts `{ provider: "confluence", providerDocId: "123456", title: "Design Doc", url: "https://company.atlassian.net/wiki/..." }` to `/api/tasks/:id/documents`
- **THEN** the system upserts the document with `provider = "confluence"` and links it to the task, returning `201` with the updated task

#### Scenario: Missing provider field
- **WHEN** the request body omits `provider`
- **THEN** the system returns `400` with `{ code: "BAD_REQUEST" }`

#### Scenario: Document already attached
- **WHEN** the document is already linked to the task
- **THEN** the system returns `409` with `{ code: "ALREADY_ATTACHED" }`

#### Scenario: Task not found
- **WHEN** the task `id` does not exist
- **THEN** the system returns `404` with `{ code: "NOT_FOUND" }`

### Requirement: Detach document from task
The system SHALL provide `DELETE /api/tasks/:id/documents/:documentId` (auth-required) that removes the link between a document and a task. The `documents` row is retained. Returns `204` on success or `404` if the link does not exist.

#### Scenario: Successful detach
- **WHEN** a client deletes `/api/tasks/:id/documents/:documentId`
- **THEN** the system removes the `task_documents` row and returns `204`

#### Scenario: Link not found
- **WHEN** the document is not attached to the task
- **THEN** the system returns `404` with `{ code: "NOT_FOUND" }`

### Requirement: Task responses include documents
The `enrichTask` helper SHALL query `task_documents` and `documents` to populate the `documents: Document[]` field on every task response. Each entry MUST include `id`, `provider`, `providerDocId`, `title`, and `url`.

#### Scenario: Task with attached documents
- **WHEN** a task has documents attached
- **THEN** `GET /api/tasks` and any single-task response include the full `documents` array

#### Scenario: Task with no documents
- **WHEN** a task has no documents attached
- **THEN** the `documents` field is an empty array `[]`

### Requirement: Document links open in-app editor
Document links rendered in `TaskDetailDialog`, `EventDetailModal`, and Sidebar task rows SHALL call `openDocumentPage` on click instead of navigating to Notion externally. The link MUST still render as a styled anchor but MUST prevent default navigation and open the `DocumentEditorPage` overlay instead.

#### Scenario: Click document link in TaskDetailDialog
- **WHEN** the user clicks a document link in the task detail dialog
- **THEN** `openDocumentPage` is called with the document's `id`, `title`, and `url`, and the editor overlay opens

#### Scenario: Click document link in EventDetailModal
- **WHEN** the user clicks a document link in the event detail modal
- **THEN** `openDocumentPage` is called and the editor overlay opens

#### Scenario: Click document link in Sidebar task row
- **WHEN** the user clicks a document link in a sidebar task row
- **THEN** `openDocumentPage` is called and the editor overlay opens
