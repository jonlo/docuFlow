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
