## ADDED Requirements

### Requirement: Generate Confluence OAuth consent URL
The system SHALL provide `GET /api/auth/confluence/url` (no auth required) that returns an Atlassian OAuth 2.0 authorization URL. The URL MUST request scopes `read:confluence-content.all offline_access` and include a `state` parameter stored in KV with a 5-minute TTL. The `redirect_uri` MUST point to `GET /api/auth/confluence/callback`.

#### Scenario: Client requests consent URL
- **WHEN** a client calls `GET /api/auth/confluence/url`
- **THEN** the system generates a random `state` value, stores it in KV with a 5-minute TTL, and returns `200` with `{ url: "<atlassian-consent-url>" }` targeting `https://auth.atlassian.com/authorize`

#### Scenario: State token expires before callback
- **WHEN** the callback arrives with a `state` that has expired in KV
- **THEN** the system returns `400` with `{ code: "INVALID_STATE" }`

### Requirement: Handle Confluence OAuth callback
The system SHALL provide `GET /api/auth/confluence/callback` that accepts `code` and `state` from Atlassian's redirect. It MUST: (1) validate the `state` against KV and delete it, (2) exchange the code for `access_token` and `refresh_token` at `https://auth.atlassian.com/oauth/token`, (3) call `GET https://api.atlassian.com/oauth/token/accessible-resources` to retrieve the user's first Confluence Cloud ID, (4) store `confluenceToken`, `confluenceRefreshToken`, `confluenceTokenExpiry`, and `confluenceCloudId` into the existing session KV entry, and (5) redirect the browser to the frontend origin.

#### Scenario: Valid callback
- **WHEN** Atlassian redirects with a valid `code` and matching `state`
- **THEN** the system exchanges the code, fetches the cloud ID, updates the session KV entry with Confluence tokens, and redirects to the frontend

#### Scenario: Invalid state
- **WHEN** the `state` parameter does not match the KV value
- **THEN** the system returns `400` with `{ code: "INVALID_STATE" }`

#### Scenario: Atlassian returns error
- **WHEN** Atlassian redirects with `error=access_denied`
- **THEN** the system returns `400` with `{ code: "OAUTH_DENIED" }`

#### Scenario: No accessible Confluence sites
- **WHEN** the user's Atlassian account has no accessible Confluence Cloud sites
- **THEN** the system returns `400` with `{ code: "NO_CONFLUENCE_SITE" }`

### Requirement: Disconnect Confluence integration
The system SHALL provide `DELETE /api/auth/confluence` (auth-required) that removes `confluenceToken`, `confluenceRefreshToken`, `confluenceTokenExpiry`, and `confluenceCloudId` from the user's session KV entry.

#### Scenario: Successful disconnect
- **WHEN** an authenticated user calls `DELETE /api/auth/confluence`
- **THEN** the system removes all Confluence token fields from the session and returns `200 { ok: true }`

#### Scenario: Not connected
- **WHEN** the user has no Confluence tokens in their session
- **THEN** the system still returns `200 { ok: true }` (idempotent)

### Requirement: Confluence connection reflected in auth status
The `GET /api/auth/status` response SHALL include `confluenceConnected: boolean` indicating whether the session has a valid Confluence token.

#### Scenario: Confluence connected
- **WHEN** a client calls `GET /api/auth/status` and the session has `confluenceToken`
- **THEN** the response includes `confluenceConnected: true`

#### Scenario: Confluence not connected
- **WHEN** the session has no `confluenceToken`
- **THEN** the response includes `confluenceConnected: false`
