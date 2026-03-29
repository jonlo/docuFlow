## ADDED Requirements

### Requirement: Generate Google OAuth consent URL
The system SHALL provide an endpoint `GET /api/auth/google/url` that returns a Google OAuth 2.0 authorization URL. The URL MUST request the `https://www.googleapis.com/auth/calendar.readonly` scope and `offline` access type to obtain a refresh token. A `state` parameter MUST be included and validated in the callback to prevent CSRF. The `state` value MUST be stored in KV with a 5-minute TTL and deleted after first use.

#### Scenario: Client requests consent URL
- **WHEN** an unauthenticated client calls `GET /api/auth/google/url`
- **THEN** the system generates a random `state` value, stores it in KV with a 5-minute TTL, and returns `200` with `{ "url": "<google-consent-url>" }` where the URL includes `client_id`, `redirect_uri`, `scope`, `access_type=offline`, `prompt=consent`, and the `state` value

#### Scenario: State token expires before callback
- **WHEN** Google redirects to `/api/auth/google/callback` with a `state` that has expired in KV (after 5 minutes)
- **THEN** the system returns `400` with `{ "error": "Invalid state parameter", "code": "INVALID_STATE" }`

### Requirement: Handle OAuth callback and establish session
The system SHALL provide an endpoint `GET /api/auth/google/callback` that accepts the `code` and `state` query parameters from Google's redirect, exchanges the code for tokens, stores the tokens in KV, upserts the user in D1, and issues a session cookie.

#### Scenario: Valid callback with authorization code
- **WHEN** Google redirects to `/api/auth/google/callback?code=<code>&state=<valid-state>`
- **THEN** the system exchanges the code for `access_token`, `refresh_token`, and `expiry`
- **THEN** the system stores tokens in KV under `oauth:{user_id}` with a TTL matching the refresh token lifetime
- **THEN** the system upserts the user row in D1 `users` table using the `sub` claim as `google_id`
- **THEN** the system creates a session in KV under `session:{uuid}` with a 7-day TTL
- **THEN** the system sets a `session` cookie (HttpOnly, SameSite=Lax) and redirects to the frontend origin

#### Scenario: Callback with invalid or missing state
- **WHEN** Google redirects to `/api/auth/google/callback` with a `state` that does not match the stored value
- **THEN** the system returns `400` with `{ "error": "Invalid state parameter", "code": "INVALID_STATE" }`

#### Scenario: Callback with error from Google
- **WHEN** Google redirects to `/api/auth/google/callback?error=access_denied`
- **THEN** the system returns `400` with `{ "error": "OAuth authorization denied", "code": "OAUTH_DENIED" }`

### Requirement: Report authentication status
The system SHALL provide an endpoint `GET /api/auth/status` that returns whether the current request has a valid session.

#### Scenario: Request with valid session cookie
- **WHEN** a client sends `GET /api/auth/status` with a valid `session` cookie
- **THEN** the system returns `200` with `{ "authenticated": true, "user": { "email": "<email>", "name": "<name>" } }`

#### Scenario: Request with no or expired session cookie
- **WHEN** a client sends `GET /api/auth/status` without a session cookie, or with an expired one
- **THEN** the system returns `200` with `{ "authenticated": false }`

### Requirement: Transparent access token refresh
The system SHALL automatically refresh the Google access token using the stored refresh token when the access token is expired or within 60 seconds of expiry, before any Google API call.

#### Scenario: Access token is expired
- **WHEN** the system needs to call the Google API and the stored access token is expired
- **THEN** the system uses the refresh token to obtain a new access token
- **THEN** the system updates the token record in KV with the new access token and expiry
- **THEN** the original API call proceeds with the new token

#### Scenario: Refresh token is invalid or revoked
- **WHEN** the system attempts to refresh and Google returns an error
- **THEN** the system deletes the session and tokens from KV
- **THEN** any API call that required auth returns `401` with `{ "error": "Session expired", "code": "SESSION_EXPIRED" }`
