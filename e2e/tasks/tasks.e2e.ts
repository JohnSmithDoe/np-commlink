/* ─── why ─────────────────────────────────────────────────────────
 * Tasks and the household lists share one dialog base and one list page, so
 * the first two tests are the per-domain wiring check rather than
 * coverage of either — the behaviour is proved once, in
 * `e2e/household/storage.e2e.ts`.
 *
 * The reload test is the one thing only tasks can prove for itself, and
 * it guards silent data loss rather than a red screen: on re-entry the
 * route registers the slice at empty `initialState` and the resolver
 * dispatches `[Tasks] load`, which the save effect must exclude or it
 * writes that empty slice over the saved tasks before the load effect
 * ever reads them.
 * ───────────────────────────────────────────────────────────────── */

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
    await addViaSearch(page, 'Persist me');
    await expect(listRow(page, /Persist me/)).toBeVisible({ timeout: 10_000 });
    await waitForPersisted(page, 'tasks', 'Persist me');

    await page.reload();
    await waitForListPage(page);

    await expect(listRow(page, /Persist me/)).toBeVisible({ timeout: 10_000 });
  });
});
