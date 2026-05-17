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
  // Intercept Google's domain at context level so the popup loads instantly
  // without hitting the real Google server (which may be slow or unavailable in CI).
  await page.context().route(/accounts\.google\.com/, route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Mock OAuth</body></html>' }),
  );
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /connect google calendar/i }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState('load', { timeout: 10_000 });
  expect(popup.url()).toContain('accounts.google.com');
});
