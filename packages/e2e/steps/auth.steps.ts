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
  expect(popup.url()).toContain('accounts.google.com');
});
