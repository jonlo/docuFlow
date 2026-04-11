## ADDED Requirements

### Requirement: Notion page search endpoint
The system SHALL provide `GET /api/notion/search?q=<query>` (auth-required) that searches the authenticated user's Notion workspace for pages whose title contains the query string. It MUST use the Notion integration token stored in KV under the user's session. The response MUST be an array of `{ id: string; title: string; url: string }` objects, ordered by Notion's default relevance. If no Notion token is configured for the user, the system MUST return `400` with `{ code: "NOTION_NOT_CONFIGURED" }`.

#### Scenario: Successful search
- **WHEN** an authenticated user calls `GET /api/notion/search?q=spec`
- **THEN** the system returns `200` with an array of matching Notion pages, each with `id`, `title`, and `url`

#### Scenario: No results
- **WHEN** the query matches no Notion pages
- **THEN** the system returns `200` with an empty array

#### Scenario: Notion token not configured
- **WHEN** the user has not connected their Notion integration
- **THEN** the system returns `400` with `{ error: "Notion not configured", code: "NOTION_NOT_CONFIGURED" }`

#### Scenario: Unauthenticated request
- **WHEN** a client calls `GET /api/notion/search` without a valid session
- **THEN** the system returns `401`

#### Scenario: Empty query
- **WHEN** the `q` parameter is empty or absent
- **THEN** the system returns `400` with `{ code: "BAD_REQUEST" }`

### Requirement: Fetch Notion page blocks
The system SHALL provide `GET /api/notion/documents/:providerDocId` (auth-required). It MUST read the session's Notion token from KV, call `GET https://api.notion.com/v1/blocks/:providerDocId/children?page_size=100`, convert the returned Notion block objects to BlockNote-compatible JSON, and return `{ blocks: BlockNoteBlock[]; hasUnsupportedBlocks: boolean }`. If no Notion token is in the session it MUST return `400 NOTION_NOT_CONFIGURED`. If the Notion API returns an error it MUST return `502 NOTION_API_ERROR`.

#### Scenario: Successful fetch
- **WHEN** a client calls `GET /api/notion/documents/:providerDocId` with a valid session
- **THEN** the API returns `200` with `{ blocks: [...], hasUnsupportedBlocks: false }`

#### Scenario: Page contains unsupported blocks
- **WHEN** the Notion page contains block types not in the supported set
- **THEN** the API returns `200` with `{ blocks: [...], hasUnsupportedBlocks: true }` and unsupported blocks are converted to plain paragraphs

#### Scenario: Notion not configured
- **WHEN** the session has no Notion token
- **THEN** the API returns `400` with `{ code: "NOTION_NOT_CONFIGURED" }`

### Requirement: Write BlockNote blocks to Notion
The system SHALL provide `PUT /api/notion/documents/:providerDocId` (auth-required). The request body MUST be `{ blocks: BlockNoteBlock[] }`. The API MUST: (1) fetch existing children of the page block, (2) archive each child block via `DELETE https://api.notion.com/v1/blocks/:blockId`, (3) append the new blocks via `PATCH https://api.notion.com/v1/blocks/:providerDocId/children`. On success it MUST return `200 { ok: true }`. On Notion API error it MUST return `502 NOTION_API_ERROR`.

#### Scenario: Successful sync
- **WHEN** a client sends updated blocks to `PUT /api/notion/documents/:providerDocId`
- **THEN** the API archives existing children, appends new blocks, and returns `200 { ok: true }`

#### Scenario: Empty blocks array
- **WHEN** the client sends `{ blocks: [] }`
- **THEN** the API archives all existing children and appends nothing, effectively clearing the page, returning `200 { ok: true }`

#### Scenario: Notion API error during sync
- **WHEN** the Notion API returns an error during archive or append
- **THEN** the API returns `502` with `{ code: "NOTION_API_ERROR" }`
