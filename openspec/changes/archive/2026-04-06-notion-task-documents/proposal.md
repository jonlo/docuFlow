## Why

Tasks in FlowDocs currently have no way to reference supporting material. Users work with Notion documents alongside their tasks but must switch context manually to find them. Attaching Notion documents directly to tasks eliminates that friction and makes tasks self-contained.

## What Changes

- Tasks can have zero or more Notion documents attached to them
- Attached documents display their Notion page title inside the task UI
- Clicking an attached document opens the Notion page in a new browser tab
- Users can search for Notion pages by title and attach them to a task via the task form
- Users can detach documents from a task
- The backend provides endpoints to search Notion pages and manage task–document associations

## Capabilities

### New Capabilities

- `notion-document-search`: Backend endpoint that proxies Notion API search by title using the user's stored Notion integration token; returns matching page IDs and titles
- `task-documents`: Attach, list, and detach Notion documents on a task; documents stored in the existing `documents` + `task_documents` D1 tables; surface document list in `TaskFormModal` and `TaskPanel`

### Modified Capabilities

- `task-form`: `TaskFormModal` gains a document search field and attached-document list with detach action
- `task-crud`: `GET /api/tasks` and individual task responses include the `documents` array (currently always `[]`)

## Impact

- **Backend**: New routes `GET /api/notion/search` (Notion page search) and `POST/DELETE /api/tasks/:id/documents/:documentId` (attach/detach); `enrichTask` populates `documents` from D1
- **Frontend**: `TaskFormModal` and `TaskPanel` updated to show and manage attached documents
- **Shared types**: `Document` type already exists in schema; ensure `Task.documents` is typed as `Document[]`
- **Dependencies**: Notion API (internal integration token, already supported in `IntegrationBadge`); no new npm packages needed — fetch-based Notion calls
- **D1**: `documents` and `task_documents` tables already exist in `schema.sql`; no migration needed
