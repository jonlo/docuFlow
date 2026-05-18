import { createBdd } from 'playwright-bdd';
import { test, expect, MOCK_AUTH_STATUS, MOCK_EVENTS, DISCONNECTED_AUTH_STATUS } from '../fixtures/auth';

const { Given, When, Then } = createBdd(test);

// ── Auth state setup ──────────────────────────────────────────────────────────

Given('Google Calendar is disconnected', async ({ page }) => {
  await page.route('**/api/auth/status', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(DISCONNECTED_AUTH_STATUS),
    }),
  );
  await page.route('**/api/events*', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );
  await page.route('**/api/auth/google/url*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://accounts.google.com/o/oauth2/auth?client_id=test&scope=calendar' }),
    }),
  );
});

Given('Google Calendar is connected', async ({ page }) => {
  await page.route('**/api/auth/status', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_AUTH_STATUS),
    }),
  );
  await page.route('**/api/events*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_EVENTS),
    }),
  );
});

// ── OAuth UI assertions ───────────────────────────────────────────────────────

Then('the connect Google Calendar button is visible', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: /connect google calendar/i }),
  ).toBeVisible();
});

Then('the connect Google Calendar button is not visible', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: /connect google calendar/i }),
  ).not.toBeVisible();
});

Then('clicking the connect button opens a Google accounts popup', async ({ page }) => {
  // Stub window.open so no real popup (and no real network request) is needed in CI.
  // We just verify that clicking the button causes window.open to be called with the
  // expected Google OAuth URL — that's the observable contract of this feature.
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>)['_capturedOpenUrl'] = null;
    window.open = (url?: string | URL) => {
      (window as unknown as Record<string, unknown>)['_capturedOpenUrl'] = String(url ?? '');
      return null;
    };
  });

  await page.getByRole('button', { name: /connect google calendar/i }).click();

  // Wait until window.open has been called (the app fetches the URL async before opening).
  const capturedUrl = await page.waitForFunction(
    () => (window as unknown as Record<string, unknown>)['_capturedOpenUrl'] as string | null,
    { timeout: 10_000 },
  );

  expect(await capturedUrl.jsonValue()).toContain('accounts.google.com');
});
