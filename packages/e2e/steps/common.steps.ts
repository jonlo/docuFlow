import { createBdd } from 'playwright-bdd';
import { test, expect } from '../fixtures/auth';

const { Given, When, Then } = createBdd(test);

// ── Navigation ────────────────────────────────────────────────────────────────

Given('I am authenticated and on the calendar page', async ({ authenticatedPage: page }) => {
  await page.goto('/');
  await page.locator('[data-testid="calendar-view"]').waitFor();
});

When('I visit the home page', async ({ page }) => {
  await page.goto('/');
});

When('I reload the page', async ({ page }) => {
  await page.reload();
});

When('I click the next week button', async ({ page }) => {
  await page.getByRole('button', { name: /next/i }).click();
});

When('I click the previous week button', async ({ page }) => {
  await page.getByRole('button', { name: /prev|back/i }).click();
});

When('I click the today button', async ({ page }) => {
  await page.getByRole('button', { name: /today/i }).click();
});

// ── Calendar header state ─────────────────────────────────────────────────────

Given('I have noted the current calendar header', async ({ page, state }) => {
  state.calendarHeader = await page.locator('[data-testid="calendar-header"]').textContent();
});

When('I note the current calendar header', async ({ page, state }) => {
  state.calendarHeader = await page.locator('[data-testid="calendar-header"]').textContent();
});

// ── Calendar assertions ───────────────────────────────────────────────────────

Then('the calendar view is visible', async ({ page }) => {
  await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible({ timeout: 15_000 });
});

Then('at least one event block is visible', async ({ page }) => {
  await expect(page.locator('[data-testid="calendar-event"]').first()).toBeVisible({ timeout: 10_000 });
});

Then('the first event block has a non-empty title', async ({ page }) => {
  const first = page.locator('[data-testid="calendar-event"]').first();
  await expect(first).toBeVisible({ timeout: 10_000 });
  const title = await first.textContent();
  expect(title?.trim().length).toBeGreaterThan(0);
});

Then('the calendar header has changed', async ({ page, state }) => {
  const current = await page.locator('[data-testid="calendar-header"]').textContent();
  expect(current).not.toBe(state.calendarHeader);
});

Then('the calendar header matches the noted header', async ({ page, state }) => {
  const current = await page.locator('[data-testid="calendar-header"]').textContent();
  expect(current).toBe(state.calendarHeader);
});

// ── Shared task block precondition ────────────────────────────────────────────

Given('a task block exists on the calendar', async ({ page }) => {
  const taskBlock = page.locator('[data-testid="calendar-event"][data-task="true"]').first();
  const count = await taskBlock.count();
  if (count === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (test as any).skip();
  }
});
