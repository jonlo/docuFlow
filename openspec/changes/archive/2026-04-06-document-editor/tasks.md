## 1. Dependencies & Store

- [x] 1.1 Install BlockNote packages in `packages/web`: `pnpm --filter @flowdocs/web add @blocknote/core @blocknote/react @blocknote/mantine`
- [x] 1.2 Add `documentPage: { id: string; title: string; url: string } | null` to `AppState` in `packages/web/src/stores/appStore.ts`
- [x] 1.3 Add `openDocumentPage(doc: { id: string; title: string; url: string })` and `closeDocumentPage()` actions to the store

## 2. API — Fetch Notion Page Blocks

- [x] 2.1 Create `notionBlocksToBlockNote(blocks: NotionBlock[]): { blocks: BlockNoteBlock[]; hasUnsupportedBlocks: boolean }` conversion utility in `packages/api/src/routes/notion.ts` (or a new `packages/api/src/notion/convert.ts`)
- [x] 2.2 Add `GET /api/notion/documents/:providerDocId` route to `packages/api/src/routes/notion.ts` — reads session Notion token, calls Notion Blocks API, converts and returns blocks; returns `400 NOTION_NOT_CONFIGURED` or `502 NOTION_API_ERROR` on failure

## 3. API — Write BlockNote Blocks to Notion

- [x] 3.1 Create `blockNoteToNotionBlocks(blocks: BlockNoteBlock[]): NotionBlock[]` conversion utility (inverse of 2.1)
- [x] 3.2 Add `PUT /api/notion/documents/:providerDocId` route — fetches existing child block IDs, archives each via `DELETE /v1/blocks/:id`, appends new blocks via `PATCH /v1/blocks/:providerDocId/children`; returns `200 { ok: true }` or `502 NOTION_API_ERROR`

## 4. Frontend — DocumentEditorPage

- [x] 4.1 Create `packages/web/src/documents/DocumentEditorPage.tsx` — full-page overlay (`fixed inset-0 z-50`) with header (Back button, title, "Open in Notion" link, "Sync to Notion" button) and BlockNote editor body
- [x] 4.2 On mount, call `GET /api/notion/documents/:providerDocId` (using `providerDocId` from store `documentPage.id`); show loading spinner while fetching; populate editor on success
- [x] 4.3 Show unsupported-blocks warning banner when API returns `hasUnsupportedBlocks: true`
- [x] 4.4 Show error state with Retry button if the fetch fails
- [x] 4.5 Implement "Sync to Notion" button: call `PUT /api/notion/documents/:providerDocId` with current editor blocks; disable button during request; show inline success/error feedback

## 5. Frontend — App Wiring

- [x] 5.1 In `App.tsx`, render `<DocumentEditorPage />` as a full-page overlay when `documentPage` is non-null (conditional render above the main layout)

## 6. Frontend — Document Link Interception

- [x] 6.1 In `packages/web/src/tasks/TaskDetailDialog.tsx`, change document `<a>` tags to call `openDocumentPage({ id: doc.providerDocId, title: doc.title, url: doc.url })` on click (prevent default)
- [x] 6.2 In `packages/web/src/google/EventDetailModal.tsx`, do the same for document links in task rows
- [x] 6.3 In `packages/web/src/components/layout/Sidebar.tsx`, do the same for document links in `TaskRow`
- [x] 6.4 In `packages/web/src/tasks/TaskFormModal.tsx`, document links in the attached-docs list should also use `openDocumentPage`

## 7. Validation

- [x] 7.1 Verify clicking a document link in `TaskDetailDialog` opens the editor overlay (not Notion)
- [x] 7.2 Verify the editor loads and displays the Notion page content
- [x] 7.3 Verify the unsupported-blocks banner appears for pages with complex blocks
- [x] 7.4 Verify "Sync to Notion" sends updated content and shows success feedback
- [x] 7.5 Verify "Open in Notion" opens the correct URL in a new tab
- [x] 7.6 Verify the Back button closes the overlay and restores the previous view
- [x] 7.7 Run TypeScript check: `pnpm --filter @flowdocs/web exec tsc --noEmit && pnpm --filter @flowdocs/api exec tsc --noEmit`
