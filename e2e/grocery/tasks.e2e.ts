import { expect, test } from '@playwright/test';
import { addViaSearch, waitForListPage } from '../helpers';

test.describe('tasks list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/tasks/_tasks');
    await waitForListPage(page);
  });

  test('adds a task through the searchbar', async ({ page }) => {
    await addViaSearch(page, 'Buy stamps');
    await expect(page.getByText(/Buy stamps/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // Drives the refactored task edit dialog (pure-ui modal + local draft).
  test('edits a task through the edit dialog', async ({ page }) => {
    await addViaSearch(page, 'Buy stamps');
    await expect(page.getByText(/Buy stamps/).first()).toBeVisible({
      timeout: 10_000,
    });
    await page
      .getByText(/Buy stamps/)
      .first()
      .click();

    const nameField = page.getByRole('textbox', { name: 'Name' });
    await expect(nameField).toBeVisible({ timeout: 10_000 });
    await nameField.fill('Buy postcards');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(page.getByText(/Buy postcards/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('keeps tasks across a full reload (hydration must not clobber storage)', async ({
    page,
  }) => {
    // Regression: a returning user re-entering /tasks must not lose data — the
    // route's `[Tasks] load` fires at empty initialState, and the persist
    // effect must ignore it so the load effect reads the real saved tasks.
    await addViaSearch(page, 'Persist me');
    await expect(page.getByText(/Persist me/).first()).toBeVisible({
      timeout: 10_000,
    });
    await page.waitForTimeout(400); // let the save flush to IndexedDB

    // Cold reload → fresh boot → re-enter the lazy tasks route.
    await page.reload();
    await waitForListPage(page);

    await expect(page.getByText(/Persist me/).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
