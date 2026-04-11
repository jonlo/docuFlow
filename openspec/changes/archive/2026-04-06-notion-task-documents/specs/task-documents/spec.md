## ADDED Requirements

### Requirement: Attach document to task
The system SHALL provide `POST /api/tasks/:id/documents` (auth-required) that attaches a Notion document to the specified task. The request body MUST contain `{ providerDocId: string; title: string; url: string }`. The system MUST upsert the document into the `documents` table (`INSERT OR IGNORE`) and then insert a row into `task_documents`. If the task does not exist, the system MUST return `404`. If the document is already attached to this task, the system MUST return `409`.

#### Scenario: Successful attach
- **WHEN** a client posts `{ providerDocId: "abc", title: "My Page", url: "https://notion.so/..." }` to `/api/tasks/:id/documents`
- **THEN** the system upserts the document record and links it to the task, returning `201` with the updated task (including `documents` array)

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
