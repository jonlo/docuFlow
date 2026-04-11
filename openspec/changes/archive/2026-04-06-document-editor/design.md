## Context

FlowDocs currently stores document references (title, URL, `providerDocId`) and links them to tasks. The Notion session token is stored server-side in KV. The frontend has no way to read or write Notion page content — it only holds metadata. The existing Notion search route (`GET /api/notion/search`) already authenticates via the session cookie and calls the Notion API.

BlockNote is a Notion-style block editor built on ProseMirror/TipTap. It has a first-class Notion block import/export capability via `@blocknote/core`'s `notionToBlocks` and custom converters, but more practically: we fetch Notion blocks via the Blocks API and convert them to BlockNote's JSON format, then on save convert back and write via `PATCH`.

## Goals / Non-Goals

**Goals:**
- Fetch a Notion page's block content from the API and render it in a BlockNote editor
- Allow the user to edit content locally (in-memory)
- "Sync to Notion" button pushes the current editor state back to Notion (replace children)
- "Open in Notion" button opens the original Notion URL in a new tab
- Seamless navigation: document links open the in-app editor; back button returns to previous view

**Non-Goals:**
- Real-time collaborative editing
- Offline persistence of edits (edits are lost on navigation unless synced)
- Supporting Confluence documents in the editor (Confluence remains link-only)
- Full Notion block type parity (complex blocks like databases, synced blocks, callouts with icons render as plain text or are omitted)

## Decisions

### BlockNote as the editor
**Decision:** Use `@blocknote/react` + `@blocknote/mantine` for the editor UI.

**Rationale:** BlockNote is purpose-built for Notion-like editing, has a clean React API, and ships its own Mantine-based theme that can be overridden. Alternative: TipTap directly — more flexible but requires building all UI from scratch. BlockNote's `useCreateBlockNote` hook and `<BlockNoteView>` make integration trivial.

### Block conversion: Notion API ↔ BlockNote
**Decision:** The API layer converts Notion block objects (from `GET /v1/blocks/:id/children`) to BlockNote-compatible JSON, and converts back on save.

**Rationale:** The frontend should not know about Notion's block schema. The API owns the Notion integration. A conversion utility in the API (`notionBlocksToBlockNote`, `blockNoteToNotionBlocks`) keeps the frontend clean.

**Supported block types for MVP:** `paragraph`, `heading_1/2/3`, `bulleted_list_item`, `numbered_list_item`, `to_do`, `quote`, `code`, `divider`. Unsupported blocks are converted to a plain paragraph with their text content.

### Navigation: Zustand overlay state (not a new `activePage`)
**Decision:** Add a `documentPage: { id: string; title: string; url: string } | null` field to Zustand. When set, `App.tsx` renders `<DocumentEditorPage>` as a full-page overlay (z-index above main content). Clearing it returns to the previous view.

**Rationale:** Using `activePage` would require saving and restoring the previous page. An overlay pattern is simpler — the underlying page is still mounted and resumes naturally when the overlay closes. This also avoids adding another value to the `activePage` union.

### Sync strategy: full replace
**Decision:** On "Sync to Notion", the API deletes all existing children of the page block and re-appends the new blocks (`PATCH /v1/blocks/:pageId/children` with append, after archiving old children).

**Rationale:** Notion's Blocks API does not support partial updates by position. The simplest correct approach is to archive all existing children then append the new set. Risk: if sync fails mid-way, the page may be partially updated — mitigated by doing the archive + append in sequence and surfacing errors clearly to the user.

## Risks / Trade-offs

- **Block conversion fidelity** → Complex Notion blocks (tables, databases, embeds) will lose formatting. Mitigation: display a warning banner if unsupported blocks are detected. Users can always open in Notion for full fidelity.
- **Sync clobbers concurrent edits** → If another user edited the Notion page while this user had it open, sync will overwrite their changes. Mitigation: out of scope for MVP; document in UI ("This will replace the current Notion page content").
- **BlockNote bundle size** → ~200 KB gzipped. Acceptable; loaded only when navigating to a document.
- **Mantine CSS conflict** → BlockNote/Mantine ships global CSS. Mitigation: use `@blocknote/mantine`'s scoped theme wrapper and import CSS only in the `DocumentEditorPage` component file.
