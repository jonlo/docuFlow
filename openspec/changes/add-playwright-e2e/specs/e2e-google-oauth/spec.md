## ADDED Requirements

### Requirement: User can sign in via Google OAuth
The system SHALL allow an unauthenticated user to initiate the Google OAuth flow from the app, complete it in a popup window, and arrive at the authenticated app state without a full page reload.

#### Scenario: Sign-in button is visible when unauthenticated
- **WHEN** user visits the app root while not authenticated
- **THEN** a "Sign in with Google" button SHALL be visible and enabled

#### Scenario: Clicking sign-in opens the Google OAuth popup
- **WHEN** user clicks the "Sign in with Google" button
- **THEN** a new popup window SHALL open pointing to the Google OAuth consent URL

#### Scenario: Successful OAuth completes and dismisses popup
- **WHEN** user completes the Google OAuth consent flow in the popup
- **THEN** the popup SHALL close automatically and the main window SHALL reflect authenticated state (calendar view visible, sign-in button gone)

#### Scenario: Session persists across page reload
- **WHEN** user is authenticated and reloads the page
- **THEN** the app SHALL still show the authenticated state without requiring re-login

### Requirement: Authenticated session is stored and reusable across test suites
The test infrastructure SHALL persist the authenticated browser session to disk after the Google OAuth spec runs so that other test suites can reuse it without repeating the login flow.

#### Scenario: Storage state is saved after login
- **WHEN** the Google OAuth test fixture completes a successful login
- **THEN** Playwright SHALL save the browser storage state (cookies, localStorage) to a file for reuse by other tests

#### Scenario: Other test suites load the saved session
- **WHEN** a test suite other than google-oauth uses the authenticated fixture
- **THEN** Playwright SHALL load the saved storage state and the app SHALL render the authenticated view without going through OAuth
