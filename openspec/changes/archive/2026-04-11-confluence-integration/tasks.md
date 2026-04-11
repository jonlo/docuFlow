## 1. Config & Types

- [x] 1.1 Add `CONFLUENCE_CLIENT_ID` and `CONFLUENCE_CLIENT_SECRET` to `packages/api/src/types.ts` Env interface
- [x] 1.2 Extend `Session` type in `packages/api/src/google/kv.ts` with `confluenceToken?: string`, `confluenceRefreshToken?: string`, `confluenceTokenExpiry?: number`, `confluenceCloudId?: string`
- [x] 1.3 Add `confluenceConnected: boolean` to the auth status response type in `packages/shared/src/index.ts` (or `packages/api/src/types.ts` if local only)

## 2. API — Confluence OAuth

- [x] 2.1 Create `packages/api/src/routes/confluenceAuth.ts` with `GET /api/auth/confluence/url` — generate random state, store in KV with 5-min TTL, return Atlassian consent URL with scopes `read:confluence-content.all offline_access`
- [x] 2.2 Add `GET /api/auth/confluence/callback` to `confluenceAuth.ts` — validate state, exchange code at `https://auth.atlassian.com/oauth/token`, call `accessible-resources`, store `confluenceToken / confluenceRefreshToken / confluenceTokenExpiry / confluenceCloudId` into session KV entry, redirect to frontend
- [x] 2.3 Add `DELETE /api/auth/confluence` to `confluenceAuth.ts` — remove all Confluence token fields from session KV entry, return `200 { ok: true }`
- [x] 2.4 Register `confluenceAuthRoutes` in `packages/api/src/index.ts` under `/api/auth/confluence`
- [x] 2.5 Update `GET /api/auth/status` to include `confluenceConnected: true/false` based on presence of `confluenceToken` in session

## 3. API — Confluence Document Search

- [x] 3.1 Create `packages/api/src/routes/confluence.ts` with `GET /api/confluence/search?q=` — validate auth, read `confluenceToken` + `confluenceCloudId` from session, call Confluence CQL search, return `{ id, title, url }[]`; return `400 CONFLUENCE_NOT_CONFIGURED`, `401 CONFLUENCE_TOKEN_EXPIRED`, or `502 CONFLUENCE_API_ERROR` on failure
- [x] 3.2 Register `confluenceRoutes` in `packages/api/src/index.ts` under `/api/confluence`

## 4. API — Task Documents: Add `provider` Field

- [x] 4.1 In `packages/api/src/routes/tasks.ts`, update `POST /api/tasks/:id/documents` to require `provider: "notion" | "confluence"` in the request body; return `400 BAD_REQUEST` if absent; pass `provider` to the D1 upsert

## 5. Frontend — Auth / Connection Status

- [x] 5.1 Update `useAuthStatus` hook (or equivalent) in `packages/web` to consume `confluenceConnected` from the status response
- [x] 5.2 Update `packages/web/src/stores/appStore.ts` integrations list so the `confluence` integration's `connected` field is set from `confluenceConnected` in the auth status
- [x] 5.3 Update `packages/web/src/components/auth/IntegrationBadge.tsx` (or equivalent) so the Confluence integration badge shows a "Connect" button that opens `GET /api/auth/confluence/url` in a popup (same flow as Google); show "Disconnect" when connected

## 6. Frontend — Confluence Search Hook

- [x] 6.1 Create `packages/web/src/hooks/useConfluenceSearch.ts` — mirrors `useNotionSearch.ts`, calls `GET /api/confluence/search?q=`, handles `CONFLUENCE_NOT_CONFIGURED` and `CONFLUENCE_TOKEN_EXPIRED` error codes

## 7. Frontend — TaskFormModal: Provider Picker

- [x] 7.1 Add a two-tab segment (`Notion | Confluence`) above the document search field in `packages/web/src/tasks/TaskFormModal.tsx`; default to Notion tab
- [x] 7.2 When Notion tab is active, use `useNotionSearch` as before; when Confluence tab is active, use `useConfluenceSearch`
- [x] 7.3 Show "Connect Confluence first" (with a connect link) when Confluence tab is active but `confluenceConnected` is false; similarly keep "Connect Notion first" for Notion tab
- [x] 7.4 When attaching a document, include `provider: "notion" | "confluence"` in the `POST /api/tasks/:id/documents` request body based on the active tab
- [x] 7.5 For queued docs in create mode, store `provider` alongside each queued document so it is passed on creation

## 8. Frontend — Document Link Behavior

- [x] 8.1 Update `packages/web/src/tasks/TaskFormModal.tsx` attached-docs list: Notion docs call `openDocumentPage`; Confluence docs open `doc.url` in a new tab; add provider badge to each row
- [x] 8.2 Update `packages/web/src/tasks/TaskDetailDialog.tsx` document links: only call `openDocumentPage` for `provider === "notion"`; Confluence links open in new tab
- [x] 8.3 Update `packages/web/src/google/EventDetailModal.tsx` document links: same provider-based routing
- [x] 8.4 Update `packages/web/src/components/layout/Sidebar.tsx` document links: same provider-based routing

## 9. Validation

- [ ] 9.1 Verify Confluence OAuth connect flow: clicking connect opens popup, redirects back, and `confluenceConnected` becomes true
- [ ] 9.2 Verify Confluence search returns results in TaskFormModal when Confluence tab is selected
- [ ] 9.3 Verify attaching a Confluence document sends `provider: "confluence"` and document appears in task
- [ ] 9.4 Verify Confluence document links open in a new tab; Notion links still open in-app editor
- [ ] 9.5 Verify "Connect Confluence first" appears when Confluence tab is selected and not connected
- [ ] 9.6 Verify `DELETE /api/auth/confluence` disconnects and `confluenceConnected` becomes false
- [x] 9.7 Run TypeScript check: `pnpm --filter @flowdocs/web exec tsc --noEmit && pnpm --filter @flowdocs/api exec tsc --noEmit`
