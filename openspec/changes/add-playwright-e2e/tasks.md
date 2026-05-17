## 1. Package Setup

- [x] 1.1 Create `packages/e2e/` directory and add `package.json` with name `@flowdocs/e2e`, declaring `@playwright/test` as a dev dependency
- [x] 1.2 Add `packages/e2e` to the pnpm workspace in `pnpm-workspace.yaml`
- [x] 1.3 Run `pnpm install` to hoist Playwright into the workspace and verify lockfile updates
- [x] 1.4 Run `npx playwright install chromium` inside `packages/e2e` to install the Chromium browser binary
- [x] 1.5 Add `"e2e": "pnpm --filter @flowdocs/e2e test"` script to the root `package.json`

## 2. Playwright Configuration

- [x] 2.1 Create `packages/e2e/playwright.config.ts` with `testDir: './tests'`, `use: { baseURL: 'http://localhost:5173' }`, and a `webServer` entry that starts `pnpm --filter @flowdocs/web dev` and waits for port 5173
- [x] 2.2 Set `projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }]` to run only Chromium in CI
- [x] 2.3 Create `packages/e2e/tsconfig.json` extending the root tsconfig, including `tests/**/*.ts`
- [x] 2.4 Add `packages/e2e/.gitignore` to exclude `playwright-report/`, `test-results/`, and `.auth/`

## 3. Auth Fixture

- [x] 3.1 Create `packages/e2e/fixtures/auth.ts` that exports a `test` fixture extending Playwright's base with an `authenticatedPage` fixture
- [x] 3.2 Implement the fixture to check for a saved storage state file at `.auth/user.json`; if it exists, load it via `browser.newContext({ storageState })` and skip login
- [x] 3.3 Implement the login path in the fixture: navigate to app root, click "Sign in with Google", handle the OAuth popup using `TEST_GOOGLE_EMAIL` and `TEST_GOOGLE_PASSWORD` env vars, wait for popup to close, then save storage state to `.auth/user.json`

## 4. Google OAuth Tests

- [x] 4.1 Create `packages/e2e/tests/google-oauth.spec.ts` importing base `test` (not the auth fixture)
- [x] 4.2 Write test: unauthenticated visit shows "Sign in with Google" button
- [x] 4.3 Write test: clicking sign-in opens a popup window
- [x] 4.4 Write test: completing OAuth dismisses popup and shows calendar view (uses `TEST_GOOGLE_EMAIL`/`TEST_GOOGLE_PASSWORD`, saves storage state)
- [x] 4.5 Write test: page reload preserves authenticated state

## 5. Calendar View Tests

- [x] 5.1 Create `packages/e2e/tests/calendar-view.spec.ts` using the `authenticatedPage` fixture
- [x] 5.2 Write test: calendar component is visible after login
- [x] 5.3 Write test: at least one event block is rendered for the current week
- [x] 5.4 Write test: event block displays the event title text
- [x] 5.5 Write test: clicking "next week" updates the header date range
- [x] 5.6 Write test: clicking "previous week" updates the header date range
- [x] 5.7 Write test: clicking "Today" returns to the current week

## 6. Task CRUD Tests

- [x] 6.1 Create `packages/e2e/tests/task-crud.spec.ts` using the `authenticatedPage` fixture
- [x] 6.2 Write test: clicking "New Task" opens the task creation form
- [x] 6.3 Write test: submitting an independent task form creates a block on the calendar
- [x] 6.4 Write test: clicking an existing calendar event shows "Add Task"; submitting creates an event-linked task visible in the event detail
- [x] 6.5 Write test: clicking an existing task block opens the edit form with current data populated
- [x] 6.6 Write test: editing task title and saving updates the calendar block label
- [x] 6.7 Write test: confirming task deletion removes the task block from the calendar

## 7. Document Attach Tests

- [x] 7.1 Create `packages/e2e/tests/document-attach.spec.ts` using the `authenticatedPage` fixture
- [x] 7.2 Write test: task panel shows a document search input when a task is open
- [x] 7.3 Write test: typing into document search with Notion selected returns a results list
- [x] 7.4 Write test: selecting a Notion result attaches it to the task and shows the page title
- [x] 7.5 Write test: typing into document search with Confluence selected returns a results list
- [x] 7.6 Write test: selecting a Confluence result attaches it to the task and shows the page title
- [x] 7.7 Write test: clicking remove on an attached document unlinks it from the task panel

## 8. CI Integration

- [x] 8.1 Add a CI job step (GitHub Actions) to install Playwright browsers: `npx playwright install --with-deps chromium`
- [x] 8.2 Add `TEST_GOOGLE_EMAIL` and `TEST_GOOGLE_PASSWORD` as GitHub Actions secrets and reference them in the CI workflow env
- [x] 8.3 Add the `pnpm e2e` step to the CI workflow after unit tests, ensuring the Worker dev server is started beforehand
- [x] 8.4 Add `packages/e2e/**` to the Cloudflare Pages ignored paths so e2e changes don't trigger a frontend redeploy
