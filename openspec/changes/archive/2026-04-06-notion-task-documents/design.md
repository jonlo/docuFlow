## Context

FlowDocs already has `documents` and `task_documents` tables in D1 and a `Document` type in `packages/shared`. The `Task` type carries a `documents: Document[]` field that `enrichTask` always returns as `[]`. The Notion integration token is stored in KV under `notion:{userId}` (set via the `IntegrationBadge` flow). No new infrastructure is needed — the feature is wiring up existing plumbing.

## Goals / Non-Goals

**Goals:**
- Allow users to search Notion pages by title from within the task form
- Attach one or more Notion pages to a task (stored in D1)
- Display attached document titles in `TaskFormModal`; clicking opens the Notion page in a new tab
- Detach a document from a task
- `GET /api/tasks` responses include populated `documents` arrays

**Non-Goals:**
- Syncing or caching Notion page content — titles are fetched at search time and stored at attach time; no background sync
- Confluence integration (separate phase)
- Editing or creating Notion pages from within FlowDocs
- Full-text search of document content

## Decisions

### 1. Store title at attach time, not fetch it on render
**Decision:** When a user attaches a document, store `{ provider: "notion", provider_doc_id, title, url }` in the `documents` table. Subsequent reads get the title from D1, not from Notion.

**Rationale:** Avoids per-render Notion API calls. Title staleness is acceptable — documents are referenced, not synced. Alternatives: fetch title on every `GET /api/tasks` (too slow, requires Notion token for every request) or store only the ID and resolve on the frontend (leaks Notion credentials to the browser).

### 2. Proxy Notion search through the Worker
**Decision:** `GET /api/notion/search?q=<query>` calls the Notion API server-side using the token from KV, returns `[{ id, title, url }]`.

**Rationale:** Keeps the Notion integration token server-side only (matches the pattern for Google OAuth). The browser never sees the token.

### 3. Reuse existing `documents` + `task_documents` tables
**Decision:** No migration. `documents(id, provider, provider_doc_id, title, url, created_at)` with `UNIQUE(provider, provider_doc_id)` and `task_documents(task_id, document_id)` already handle the many-to-many relationship.

**Rationale:** The schema was designed for this. Attaching uses `INSERT OR IGNORE` into `documents` then `INSERT INTO task_documents`. Detaching deletes from `task_documents` only (document record stays for potential reuse across tasks).

### 4. Attach/detach endpoints on the task resource
**Decision:** `POST /api/tasks/:id/documents` (body: `{ providerDocId, title, url }`) and `DELETE /api/tasks/:id/documents/:documentId`.

**Rationale:** Keeps document management scoped to the task resource. Simpler than a separate `/api/documents` top-level resource for this use case.

### 5. Search UI: inline combobox in TaskFormModal
**Decision:** A text input in `TaskFormModal` that debounces (300ms) and calls `GET /api/notion/search?q=...`, showing results in a dropdown. Selecting a result calls the attach mutation. No separate search page or modal.

**Rationale:** Inline keeps the workflow fast. A debounced 300ms delay avoids excessive Notion API calls while typing. Alternatives: a dedicated search modal (unnecessary complexity), or autocomplete on blur only (poor UX).

## Risks / Trade-offs

- **Notion token not set** → `GET /api/notion/search` returns 400 with `NOTION_NOT_CONFIGURED`. Frontend shows "Connect Notion first" inline. Mitigation: check `IntegrationBadge` state before showing search.
- **Notion API rate limits** → Search calls are user-initiated and debounced; no polling. Low risk.
- **Title staleness** → A renamed Notion page won't update in FlowDocs. Acceptable for v1; a future "refresh title" button can address this.
- **`task_documents` orphan documents** → Deleting a task cascades via FK (`task_documents.task_id` references `tasks.id` ON DELETE CASCADE), so join rows are cleaned up. The `documents` row is intentionally retained.

## Migration Plan

No schema migration required. Deploy worker, then frontend. Fully backward compatible — existing tasks return `documents: []` until documents are attached.
