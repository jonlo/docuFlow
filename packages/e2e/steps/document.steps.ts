import { createBdd } from 'playwright-bdd';
import { test, expect } from '../fixtures/auth';

const { When, Then } = createBdd(test);

// ── Document search ───────────────────────────────────────────────────────────

Then('the document search input is visible', async ({ page }) => {
  await page.locator('[data-testid="task-panel"]').waitFor();
  await expect(page.locator('[data-testid="document-search"]')).toBeVisible();
});

When('I select {string} as the document provider', async ({ page }, provider: string) => {
  const select = page.locator('[data-testid="document-provider"]');
  if (await select.isVisible()) {
    await select.selectOption(provider);
  }
});

When('I search for documents with {string}', async ({ page }, query: string) => {
  await page.locator('[data-testid="document-search"]').fill(query);
});

Then('document search results are visible', async ({ page }) => {
  await expect(page.locator('[data-testid="document-search-results"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-testid="document-search-result"]').first()).toBeVisible({ timeout: 10_000 });
});

// ── Attach / detach ───────────────────────────────────────────────────────────

When('I click the first search result', async ({ page, state }) => {
  const first = page.locator('[data-testid="document-search-result"]').first();
  await first.waitFor({ timeout: 10_000 });
  state.firstSearchResultTitle = (await first.textContent())?.trim() ?? null;
  await first.click();
});

Then('the first search result is attached to the task', async ({ page, state }) => {
  await expect(
    page.locator('[data-testid="task-document"]', { hasText: state.firstSearchResultTitle ?? '' }),
  ).toBeVisible({ timeout: 10_000 });
});

When('I remove the first attached document', async ({ page }) => {
  const doc = page.locator('[data-testid="task-document"]').first();
  await doc.getByRole('button', { name: /detach|remove|unlink|delete/i }).click();
});

Then('no attached documents are shown', async ({ page }) => {
  await expect(page.locator('[data-testid="task-document"]')).not.toBeVisible({ timeout: 10_000 });
});
