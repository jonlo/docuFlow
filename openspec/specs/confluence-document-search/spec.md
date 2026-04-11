## ADDED Requirements

### Requirement: Confluence page search endpoint
The system SHALL provide `GET /api/confluence/search?q=<query>` (auth-required) that searches the authenticated user's Confluence Cloud instance for pages whose title matches the query. It MUST use the `confluenceToken` and `confluenceCloudId` from the session KV entry. The search MUST use the CQL query `title ~ "{q}" AND type = page` against `GET https://api.atlassian.com/ex/confluence/{cloudId}/wiki/rest/api/content/search`. The response MUST be an array of `{ id: string; title: string; url: string }` objects. If no Confluence token is in the session it MUST return `400 CONFLUENCE_NOT_CONFIGURED`. If the Confluence API returns a non-2xx response it MUST return `502 CONFLUENCE_API_ERROR`.

#### Scenario: Successful search
- **WHEN** an authenticated user calls `GET /api/confluence/search?q=design`
- **THEN** the system returns `200` with an array of matching Confluence pages, each with `id`, `title`, and `url`

#### Scenario: No results
- **WHEN** the query matches no Confluence pages
- **THEN** the system returns `200` with an empty array

#### Scenario: Confluence not configured
- **WHEN** the session has no `confluenceToken`
- **THEN** the system returns `400` with `{ code: "CONFLUENCE_NOT_CONFIGURED" }`

#### Scenario: Empty query
- **WHEN** the `q` parameter is empty or absent
- **THEN** the system returns `400` with `{ code: "BAD_REQUEST" }`

#### Scenario: Confluence API error
- **WHEN** the Confluence REST API returns a non-2xx response
- **THEN** the system returns `502` with `{ code: "CONFLUENCE_API_ERROR" }`

#### Scenario: Token expired
- **WHEN** the Confluence API returns `401`
- **THEN** the system returns `401` with `{ code: "CONFLUENCE_TOKEN_EXPIRED" }` so the frontend can prompt the user to reconnect
