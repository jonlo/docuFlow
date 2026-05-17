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
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /connect google calendar/i }).click();
  const popup = await popupPromise;
  // waitForURL with waitUntil:'commit' checks the URL as soon as navigation
  // starts, without waiting for the page to fully load (Google's page is
  // external and won't load in the mocked test environment).
  await popup.waitForURL(/accounts\.google\.com/, { waitUntil: 'commit', timeout: 10_000 });
  expect(popup.url()).toContain('accounts.google.com');
});
