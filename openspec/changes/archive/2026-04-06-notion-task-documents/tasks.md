## 1. Shared Types

- [x] 1.1 Verify `Document` type in `packages/shared/src/index.ts` has `id`, `provider`, `providerDocId`, `title`, `url` fields; add any missing fields
- [x] 1.2 Confirm `Task.documents` is typed as `Document[]` in shared types (not `any[]` or missing)

## 2. Backend — Notion Search

- [x] 2.1 Create `packages/api/src/routes/notion.ts` with `GET /api/notion/search?q=` — read Notion token from KV, call Notion search API, return `{ id, title, url }[]`; return 400 `NOTION_NOT_CONFIGURED` if no token; return 400 `BAD_REQUEST` if `q` is empty
- [x] 2.2 Mount notion router in `packages/api/src/index.ts` at `/api/notion`

## 3. Backend — Task Documents

- [x] 3.1 Update `enrichTask` in `packages/api/src/routes/tasks.ts` to JOIN `task_documents` + `documents` and populate `documents: Document[]` on every task response
- [x] 3.2 Add `POST /api/tasks/:id/documents` to tasks router — validate body `{ providerDocId, title, url }`, `INSERT OR IGNORE` into `documents`, insert into `task_documents`, return 201 with updated enriched task; 409 if already attached, 404 if task not found
- [x] 3.3 Add `DELETE /api/tasks/:id/documents/:documentId` to tasks router — delete from `task_documents`, return 204; 404 if link not found

## 4. Frontend — Notion Search Hook

- [x] 4.1 Create `packages/web/src/hooks/useNotionSearch.ts` — `useQuery` with `enabled: query.length >= 2`, queryKey `["notion-search", query]`, staleTime 60s, calls `GET /api/notion/search?q=<query>`
- [x] 4.2 Create `useAttachDocument` and `useDetachDocument` mutations in `packages/web/src/hooks/useTaskMutations.ts` — POST/DELETE document endpoints, invalidate `["tasks"]` on success

## 5. Frontend — TaskFormModal Document UI

- [x] 5.1 Add attached documents list to `TaskFormModal` — render `task.documents` (in edit mode) or queued docs (in create mode); each row: clickable title link (`target="_blank"`) + detach (×) button
- [x] 5.2 Add document search input to `TaskFormModal` — text input that debounces 300ms, calls `useNotionSearch`; show dropdown of results on match; hide input and show "Connect Notion first" if `GET /api/notion/search` returns `NOTION_NOT_CONFIGURED`
- [x] 5.3 Wire result selection: in edit mode call `useAttachDocument` immediately; in create mode queue documents in local state and attach after `createTask.mutateAsync` resolves
- [x] 5.4 Wire detach button: call `useDetachDocument` in edit mode; remove from local queue in create mode

## 6. Validation

- [x] 6.1 Verify Notion search returns results when token is configured and query matches
- [x] 6.2 Verify "Connect Notion first" message appears when token is not set
- [x] 6.3 Verify attaching a document in edit mode immediately shows it in the list
- [x] 6.4 Verify attaching a document in create mode includes it after task creation
- [x] 6.5 Verify clicking a document title opens the Notion page in a new tab
- [x] 6.6 Verify detaching removes the document from the list and the DB
- [x] 6.7 Verify `GET /api/tasks` includes `documents` array for tasks with attachments
