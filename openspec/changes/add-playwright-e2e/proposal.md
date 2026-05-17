## Why

The app has no automated end-to-end tests, making it impossible to confidently verify critical user flows (Google OAuth, calendar rendering, task creation, document linking) before deploying. Adding Playwright provides fast, reliable browser-based tests that run in CI and catch regressions before they reach production.

## What Changes

- Add Playwright as a dev dependency in a new `packages/e2e` workspace package
- Configure Playwright to run against the local Vite dev server (`http://localhost:5173`) and Worker (`http://localhost:8787`)
- Add test scripts to the root `package.json` for running e2e tests locally and in CI
- Implement initial test suites covering the most critical user flows: Google OAuth, calendar view, task CRUD, and document attachment

## Capabilities

### New Capabilities

- `e2e-google-oauth`: Tests the full Google OAuth login flow — clicking sign-in, completing the OAuth popup, and verifying the authenticated state in the UI
- `e2e-calendar-view`: Tests that authenticated users see calendar events rendered correctly and can navigate between weeks/months
- `e2e-task-crud`: Tests creating, editing, and deleting tasks (both event-linked and independent), verifying they appear on the calendar
- `e2e-document-attach`: Tests attaching a Notion or Confluence document to a task and verifying the link appears in the task panel

### Modified Capabilities

## Impact

- New `packages/e2e` workspace package — no changes to `packages/web` or `packages/api` source code
- CI pipeline will need `pnpm e2e` added as a step (requires both dev servers running)
- Playwright requires Chromium/Firefox browser binaries installed in CI (`npx playwright install --with-deps`)
- Local dev requires both `pnpm dev` servers running before executing e2e tests
