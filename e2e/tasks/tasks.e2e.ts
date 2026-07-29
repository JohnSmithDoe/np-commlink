import { expect, test } from '@playwright/test';
import {
  addViaSearch,
  listRow,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

test.describe('tasks list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/tasks/list');
    await waitForListPage(page);
  });

  test('adds a task through the searchbar', async ({ page }) => {
    await addViaSearch(page, 'Buy stamps');
    await expect(listRow(page, /Buy stamps/)).toBeVisible({ timeout: 10_000 });
  });

  // Drives the refactored task edit dialog (pure-ui modal + local draft).
  test('edits a task through the edit dialog', async ({ page }) => {
    await addViaSearch(page, 'Buy stamps');
    await expect(listRow(page, /Buy stamps/)).toBeVisible({ timeout: 10_000 });
    await listRow(page, /Buy stamps/).click();

    const nameField = page.getByRole('textbox', { name: 'Name' });
    await expect(nameField).toBeVisible({ timeout: 10_000 });
    await nameField.fill('Buy postcards');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(listRow(page, /Buy postcards/)).toBeVisible({
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
    await expect(listRow(page, /Persist me/)).toBeVisible({ timeout: 10_000 });
    await waitForPersisted(page, 'tasks', 'Persist me');

    // Cold reload → fresh boot → re-enter the lazy tasks route.
    await page.reload();
    await waitForListPage(page);

    await expect(listRow(page, /Persist me/)).toBeVisible({ timeout: 10_000 });
  });
});
