## Context

The repo is a pnpm monorepo with `packages/web` (React/Vite, Cloudflare Pages) and `packages/api` (Hono, Cloudflare Workers). There are currently no automated browser tests — only unit/type-level checks. The most fragile flows (OAuth popup, calendar rendering, task–event interactions) are untested and can silently break on deploy.

Playwright is the standard choice for TypeScript monorepos targeting modern browsers. It supports multiple browser engines, has first-class async/await support, and integrates well with Vite's dev server via `webServer` config.

## Goals / Non-Goals

**Goals:**
- Set up Playwright in a dedicated `packages/e2e` workspace so test code stays isolated from app code
- Cover the four critical flows from the proposal: OAuth, calendar view, task CRUD, document attach
- Make tests runnable locally (`pnpm e2e`) and in CI with a single command
- Use Playwright's `webServer` to auto-start the Vite dev server before tests run

**Non-Goals:**
- Visual regression testing (screenshot diffing) — not needed yet
- Testing the Cloudflare Worker in isolation — API is tested implicitly via the UI flows
- 100% code coverage — only happy-path and key error scenarios for now
- Mocking Google OAuth in tests — we'll use a dedicated test Google account with real credentials stored in CI secrets

## Decisions

### 1. Separate `packages/e2e` workspace package (vs. tests inside `packages/web`)

Playwright has its own `playwright.config.ts`, browser binaries, and test runner that differ significantly from Vitest. Keeping it in its own package avoids polluting the web package's dev dependencies and config surface. The workspace can import shared types from `packages/shared` if needed.

**Alternatives considered:** Placing tests under `packages/web/e2e/` — rejected because it complicates the Vite/Vitest config and couples test infrastructure to the frontend build.

### 2. `webServer` config to auto-start Vite dev server

Playwright's `webServer` option in `playwright.config.ts` will start `pnpm --filter @flowdocs/web dev` before running tests and wait for `http://localhost:5173` to respond. This avoids requiring the developer to manually start servers before running e2e tests.

The Worker (`http://localhost:8787`) must be started manually for now — a second `webServer` entry for `wrangler dev` could be added but wrangler's startup time is unpredictable in CI.

**Alternatives considered:** Docker Compose for full-stack test environment — over-engineered for current scale.

### 3. Real Google OAuth via test account (no mocking)

Mocking OAuth at the browser level requires intercepting redirects and faking cookies, which is brittle and tests the wrong thing. We'll use a dedicated `flowdocs-test@...` Google account whose credentials are stored as CI secrets (`TEST_GOOGLE_EMAIL`, `TEST_GOOGLE_PASSWORD`). Playwright's `storageState` feature will cache the authenticated session after a one-time login fixture, so subsequent tests skip the login UI.

**Alternatives considered:** Bypassing OAuth entirely with a seeded session cookie — possible but doesn't test the actual login flow.

### 4. Test file organization by flow (not by component)

Tests are organized as `tests/<flow-name>.spec.ts` (e.g., `tests/google-oauth.spec.ts`) rather than mirroring component structure. E2e tests describe user journeys, not component trees.

## Risks / Trade-offs

- **Flaky OAuth tests** → Mitigation: Use `storageState` to persist auth after first login; only the `google-oauth.spec.ts` suite exercises the actual OAuth flow. All other tests reuse the cached session.
- **CI browser binary size** → Mitigation: Use `--project=chromium` in CI to install only Chromium (~150MB) rather than all three engines.
- **Worker not auto-started** → Mitigation: Document in README that `pnpm --filter @flowdocs/api dev` must be running. Long-term, add a second `webServer` entry once wrangler startup is reliable.
- **Test account credentials in CI** → Mitigation: Store as encrypted GitHub Actions secrets; never commit to repo. The test account has no real data and minimal permissions.

## Migration Plan

1. Add `packages/e2e` package with Playwright config
2. Add `"e2e": "pnpm --filter @flowdocs/e2e test"` script to root `package.json`
3. Add CI step after unit tests: install Playwright browsers, start Worker, run `pnpm e2e`
4. Merge — no rollback needed (additive change, no existing behavior modified)

## Open Questions

- Should we add `packages/e2e` to the Cloudflare Pages ignore list (so e2e test changes don't trigger a frontend redeploy)? Likely yes — add `packages/e2e/**` to the Pages build ignored paths.
