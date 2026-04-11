## Why

FlowDocs attaches Notion documents to tasks, but clicking a document link currently opens Notion in a new browser tab. This context-switch breaks the user's flow. By embedding a rich-text editor (BlockNote) directly in FlowDocs, users can read and edit their Notion pages without leaving the app — while still retaining the ability to open in Notion or push edits back via sync.

## What Changes

- Document links in `TaskDetailDialog`, `EventDetailModal`, and `Sidebar` task rows no longer navigate to Notion; instead they open a new `DocumentEditorPage` view within FlowDocs
- Add a `DocumentEditorPage` component: full-page view with a BlockNote editor loaded with the document's current content (fetched from Notion via the API)
- New API endpoint `GET /api/notion/documents/:providerDocId` — fetches the Notion page content as BlockNote-compatible JSON blocks
- New API endpoint `PUT /api/notion/documents/:providerDocId` — pushes updated blocks back to Notion (sync to Notion)
- The page header includes: document title, "Open in Notion" external link button, "Sync to Notion" button (saves current editor state back to Notion), and a Back button to return to the previous view
- Navigation uses a Zustand `documentPage` state (document id + title + url) rather than a router, consistent with the existing `activePage` pattern

## Capabilities

### New Capabilities
- `document-editor`: In-app document viewer and editor powered by BlockNote; load Notion page blocks, edit locally, sync back to Notion

### Modified Capabilities
- `task-documents`: Document links in TaskDetailDialog and task rows now open the in-app editor instead of navigating to Notion externally
- `notion-document-search`: API extended with read (`GET`) and write (`PUT`) endpoints for Notion page block content

## Impact

- New files: `packages/web/src/documents/DocumentEditorPage.tsx`
- New API routes: `GET /api/notion/documents/:providerDocId`, `PUT /api/notion/documents/:providerDocId`
- Modified: `packages/web/src/tasks/TaskDetailDialog.tsx`, `packages/web/src/google/EventDetailModal.tsx`, `packages/web/src/components/layout/Sidebar.tsx` — document link `onClick` handlers
- Modified: `packages/web/src/stores/appStore.ts` — add `documentPage` state for navigation
- Modified: `packages/web/src/App.tsx` — render `DocumentEditorPage` when `documentPage` is set
- New dependency: `@blocknote/react`, `@blocknote/core`, `@blocknote/mantine` (or `@blocknote/shadcn`)
- Notion API: uses Blocks API (`GET /v1/blocks/:id/children`, `PATCH /v1/blocks/:id/children`) — already authenticated via session token
