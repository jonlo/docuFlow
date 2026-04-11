## MODIFIED Requirements

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
