import { createBdd } from 'playwright-bdd';
import { test, expect } from '../fixtures/auth';

const { When, Then } = createBdd(test);

// ── Task form ─────────────────────────────────────────────────────────────────

When('I click the new task button', async ({ page }) => {
  await page.getByRole('button', { name: /new task/i }).click();
});

Then('the task form is visible', async ({ page }) => {
  await expect(page.locator('[data-testid="task-form"]')).toBeVisible();
});

When('I fill in the task title as {string}', async ({ page }, title: string) => {
  await page.getByLabel(/title/i).fill(title);
});

When('I set the task dates to today', async ({ page }) => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  await page.getByLabel(/start/i).fill(`${date}T10:00`);
  await page.getByLabel(/end/i).fill(`${date}T11:00`);
});

When('I submit the task form', async ({ page }) => {
  await page.getByRole('button', { name: /save|create/i }).click();
});

Then('a calendar event with title {string} is visible', async ({ page }, title: string) => {
  await expect(
    page.locator('[data-testid="calendar-event"]', { hasText: title }),
  ).toBeVisible({ timeout: 10_000 });
});

// ── Event detail ──────────────────────────────────────────────────────────────

When('I click the first calendar event', async ({ page }) => {
  const firstEvent = page.locator('[data-testid="calendar-event"]').first();
  await firstEvent.waitFor({ timeout: 10_000 });
  await firstEvent.click();
});

Then('the event detail panel is visible', async ({ page }) => {
  await expect(page.locator('[data-testid="event-detail"]')).toBeVisible();
});

Then('the add task button is visible', async ({ page }) => {
  await expect(page.getByRole('button', { name: /add task/i })).toBeVisible();
});

When('I click the add task button', async ({ page }) => {
  await page.getByRole('button', { name: /add task/i }).click();
  await page.locator('[data-testid="task-form"]').waitFor();
});

Then('the event detail panel contains {string}', async ({ page }, text: string) => {
  await expect(
    page.locator('[data-testid="event-detail"]', { hasText: text }),
  ).toBeVisible({ timeout: 10_000 });
});

// ── Task block CRUD ───────────────────────────────────────────────────────────

When('I click the first task block', async ({ page }) => {
  await page.locator('[data-testid="calendar-event"][data-task="true"]').first().click();
});

When('I update the task title to {string}', async ({ page }, title: string) => {
  const input = page.locator('[data-testid="task-form"]').getByLabel(/title/i);
  await input.clear();
  await input.fill(title);
});

When('I note the task title', async ({ page, state }) => {
  const taskBlock = page.locator('[data-testid="calendar-event"][data-task="true"]').first();
  state.firstTaskTitle = (await taskBlock.textContent())?.trim() ?? null;
});

When('I delete the task and confirm', async ({ page }) => {
  await page.locator('[data-testid="task-form"]').waitFor();
  await page.getByRole('button', { name: /delete/i }).click();
  const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
  if (await confirmButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await confirmButton.click();
  }
});

Then('the noted task is no longer on the calendar', async ({ page, state }) => {
  await expect(
    page.locator('[data-testid="calendar-event"]', { hasText: state.firstTaskTitle ?? '' }),
  ).not.toBeVisible({ timeout: 10_000 });
});
