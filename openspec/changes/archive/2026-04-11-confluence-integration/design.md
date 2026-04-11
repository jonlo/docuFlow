## Context

FlowDocs already has a full Google OAuth 2.0 flow and a Notion internal-token integration. The `documents` table has a `provider` column (`"notion" | "confluence"`) and the `Integration` type already lists `"confluence"` as a valid provider — the groundwork is laid. The missing pieces are: (1) an Atlassian OAuth 2.0 flow to connect a Confluence Cloud account, (2) a search endpoint against the Confluence REST API, and (3) UI changes to let users pick a provider when attaching documents.

Confluence Cloud uses Atlassian's OAuth 2.0 (3-LO) via `https://auth.atlassian.com`. Unlike Notion's internal-token model (user pastes a token), Confluence uses a proper consent-URL flow identical in structure to the Google OAuth flow already in the codebase. Access tokens expire in 1 hour; Atlassian issues refresh tokens with the `offline_access` scope.

## Goals / Non-Goals

**Goals:**
- Atlassian OAuth 2.0 connect/disconnect flow, consistent with the Google OAuth pattern
- `GET /api/confluence/search?q=` endpoint returning `{ id, title, url }[]`
- `provider` field added to `POST /api/tasks/:id/documents`
- Provider picker (Notion / Confluence tabs) in `TaskFormModal`
- Confluence document links remain external (open in new tab — no in-app editor for Confluence)

**Non-Goals:**
- Confluence document editing (read/write blocks) — link-only, same as pre-editor Notion
- Multi-space / cross-instance support (single Confluence Cloud instance per user)
- Confluence labels, metadata, or content beyond title + URL
- Automatic token refresh on every API call (same lazy approach as the rest of the app — refresh on 401)

## Decisions

### Atlassian OAuth flow — same pattern as Google
**Decision:** Mirror the existing `GET /api/auth/google/url` + `GET /api/auth/google/callback` pattern. New routes: `GET /api/auth/confluence/url`, `GET /api/auth/confluence/callback`, `DELETE /api/auth/confluence`.

**Rationale:** Consistency with the existing codebase. The KV-backed state token + session cookie pattern already handles CSRF and popup-close detection. Reusing it avoids a new auth architecture.

**Scopes requested:** `read:confluence-content.all offline_access` — sufficient for search; `offline_access` gets a refresh token.

**Accessible resources:** After token exchange, the API calls `GET https://api.atlassian.com/oauth/token/accessible-resources` to get the user's Confluence Cloud ID (`cloudId`) and stores it alongside the tokens in the session KV entry.

### Token storage — extend existing session KV schema
**Decision:** Add `confluenceToken`, `confluenceRefreshToken`, `confluenceTokenExpiry`, and `confluenceCloudId` to the `Session` type in `packages/api/src/google/kv.ts`.

**Rationale:** All OAuth state already lives in the session KV entry. A separate KV key would complicate reads. The session entry is already fetched on every auth-required route.

### Confluence search — Confluence REST API v2
**Decision:** Use `GET https://api.atlassian.com/ex/confluence/{cloudId}/wiki/rest/api/content/search?cql=title+~+"{q}"&expand=_links.webui` (CQL text search).

**Rationale:** The CQL `title ~ "{q}"` query is the standard Confluence page-title search. The `_links.webui` expand returns the browser URL. Alternative: Confluence v2 search API — still in beta and less documented. CQL is stable and well-supported.

**Response mapping:** Each result maps to `{ id: result.id, title: result.title, url: "https://<site>.atlassian.net/wiki" + result._links.webui }`.

### `provider` in attach request
**Decision:** Add a required `provider: "notion" | "confluence"` field to `POST /api/tasks/:id/documents`. The API uses it to set the `provider` column in the `documents` table.

**Rationale:** The `documents` table already has this column. Currently the attach endpoint presumably defaults to `"notion"` (or omits it). Making it explicit and required prevents ambiguity as both providers are live.

**Breaking change:** Clients sending attach requests without `provider` will get a 400. The only caller is `TaskFormModal`, which will be updated in the same change.

### Provider picker — tabs above search field
**Decision:** Replace the single Notion search input with a two-tab segment control (`Notion | Confluence`) above the existing search field. Switching tabs switches the search backend. Each tab independently shows a "not configured" message if the respective integration is not connected.

**Rationale:** Minimal UI surface. Tabs are familiar and fit the compact modal layout. Alternative: a provider dropdown on each result — more complex, less discoverable.

### Confluence links — open in new tab (no in-app editor)
**Decision:** `DocumentEditorPage` is only opened for `provider === "notion"` documents. Confluence document links call `window.open(url)` directly.

**Rationale:** The document-editor change explicitly excluded Confluence editing. Implementing Confluence block conversion is significant scope and Confluence's content API differs substantially from Notion's.

## Risks / Trade-offs

- **Atlassian token expiry (1h)** → The current implementation does not auto-refresh on expiry. On a 401 from Confluence API, the API returns `401 CONFLUENCE_TOKEN_EXPIRED` and the frontend shows a "Reconnect Confluence" prompt. Full transparent refresh can be added later.
- **CQL injection via user query** → Mitigate by escaping quotes in the query string before interpolation into CQL. Never allow raw user input directly into the CQL string.
- **Single cloudId per user** → If a user has access to multiple Atlassian sites, only the first from `accessible-resources` is stored. Acceptable for MVP.
- **`provider` field is a breaking change for the attach endpoint** → Only `TaskFormModal` calls this endpoint; it is updated atomically in the same change. No external API consumers.
