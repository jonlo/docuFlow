import { createBdd } from 'playwright-bdd';
import { test, expect } from '../fixtures/auth';

const { When, Then } = createBdd(test);

// ── Sidebar drawer state ──────────────────────────────────────────────────────

Then('the sidebar drawer is closed', async ({ page }) => {
  // The sidebar slides off-screen via translateX(-100%) when closed.
  // We verify by checking the absence of the sidebar-open CSS class.
  await expect(page.locator('[data-testid="sidebar"]')).not.toHaveClass(/sidebar-open/);
});

Then('the sidebar drawer is open', async ({ page }) => {
  await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/sidebar-open/);
});

// ── Mobile header ─────────────────────────────────────────────────────────────

Then('the mobile header is visible', async ({ page }) => {
  await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
});

Then('the mobile menu button is visible', async ({ page }) => {
  await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
});

// ── Mobile interactions ───────────────────────────────────────────────────────

When('I tap the mobile menu button', async ({ page }) => {
  await page.locator('[data-testid="mobile-menu-button"]').click();
  // Wait for sidebar to animate open before proceeding
  await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/sidebar-open/);
});

When('I tap the sidebar close button', async ({ page }) => {
  await page.locator('[data-testid="sidebar-close-button"]').click();
});

When('I tap outside the sidebar', async ({ page }) => {
  await page.locator('[data-testid="sidebar-overlay"]').click();
});

// ── Mobile navigation ─────────────────────────────────────────────────────────

When('I tap the Tasks nav item', async ({ page }) => {
  await page.locator('[data-testid="sidebar"]').getByRole('button', { name: 'Tasks' }).click();
});

When('I tap the Reports nav item', async ({ page }) => {
  await page.locator('[data-testid="sidebar"]').getByRole('button', { name: 'Reports' }).click();
});

When('I tap the New button in the sidebar', async ({ page }) => {
  await page.locator('[data-testid="sidebar"]').getByRole('button', { name: /new/i }).click();
});

When('I select Task from the new item picker', async ({ page }) => {
  // The picker dropdown shows "Task" (singular) as an option
  await page.getByRole('button', { name: 'Task' }).click();
});

// ── Page assertions ───────────────────────────────────────────────────────────

Then('the tasks page is visible', async ({ page }) => {
  await expect(page.locator('main[data-page="tasks"]')).toBeVisible({ timeout: 10_000 });
});

Then('the reports page is visible', async ({ page }) => {
  await expect(page.locator('main[data-page="reports"]')).toBeVisible({ timeout: 10_000 });
});
