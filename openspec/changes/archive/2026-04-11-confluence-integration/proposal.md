## Why

Users store documents in both Notion and Confluence, but FlowDocs only supports Notion for document search and attachment. Adding Confluence OAuth and search lets users link pages from either workspace to their tasks.

## What Changes

- Add Atlassian OAuth 2.0 flow (`GET /api/auth/confluence/url`, `GET /api/auth/confluence/callback`, `DELETE /api/auth/confluence`) to connect a Confluence Cloud account via OAuth
- Store the Atlassian access + refresh tokens in KV under the user's session (alongside the existing Notion token)
- Add `GET /api/confluence/search?q=` endpoint that searches pages in the user's connected Confluence Cloud instance
- Add `provider` field to `POST /api/tasks/:id/documents` request body (required: `"notion"` | `"confluence"`)
- Update `TaskFormModal` document section to show a provider picker (Notion / Confluence tabs) above the search field; each tab shows the relevant search input or "Connect first" message
- Confluence document links open in a new tab (link-only); Notion document links continue to open the in-app `DocumentEditorPage` editor
- Surface Confluence connection status in the existing integrations UI alongside Notion and Google

## Capabilities

### New Capabilities
- `confluence-oauth`: Atlassian OAuth 2.0 connect/disconnect flow — URL generation, callback handler, token storage, disconnect endpoint
- `confluence-document-search`: Search Confluence Cloud pages and retrieve results for task attachment

### Modified Capabilities
- `task-documents`: Add required `provider: "notion" | "confluence"` to the attach request body
- `task-form`: Replace single Notion search field with a provider picker (Notion / Confluence tabs); each tab handles its own "not configured" state; Confluence document title links open in a new tab instead of the in-app editor

## Impact

- **API**: New routes in `packages/api/src/routes/confluence.ts`; update `packages/api/src/routes/tasks.ts` attach endpoint to accept `provider`; new auth routes in `packages/api/src/routes/auth.ts` or a new `packages/api/src/routes/authConfluence.ts`; KV session schema gains `confluenceToken`, `confluenceRefreshToken`, `confluenceCloudId`
- **Frontend**: `TaskFormModal` document section updated; `IntegrationBadge` / auth status updated; `DocumentEditorPage` link behavior conditioned on `provider === "notion"`
- **Config**: New Atlassian OAuth app credentials (`CONFLUENCE_CLIENT_ID`, `CONFLUENCE_CLIENT_SECRET`) added as Worker secrets; callback URL registered in Atlassian developer console
- **Shared types**: `Document.provider` already supports `"confluence"`; `Integration.provider` already includes `"confluence"`
