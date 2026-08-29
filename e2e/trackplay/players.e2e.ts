/* ─── why ─────────────────────────────────────────────────────────
 * The undo test drives the HEADER button: a toast reports and offers
 * nothing, and this is the only e2e proving trackplay's per-entity
 * restore, which replaced a snapshot that ate anything created after the
 * delete.
 *
 * The reload test guards silent data loss: on re-entry the route
 * registers the slice at empty `initialState` and the resolver dispatches
 * `[Trackplay] load`, which the save effect must exclude or it writes
 * that empty slice over the saved player before the load effect reads it
 * back.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { listRow, slideDelete, waitForPersisted } from '../helpers';
import { createPlayer, gotoPage, mainContent } from './helpers';

test.describe('trackplay players', () => {
  test('creates two players via the dialog', async ({ page }) => {
    await gotoPage(page, 'trackplay/players', 'app-page-trackplay-players');

    await createPlayer(page, 'Alice');
    await createPlayer(page, 'Bob');

    await expect(mainContent(page).getByTestId('list-row')).toHaveCount(2);
    await expect(listRow(page, 'Alice')).toBeVisible();
    await expect(listRow(page, 'Bob')).toBeVisible();
  });

  test('deletes a player and restores it from the header button', async ({
    page,
  }) => {
    await gotoPage(page, 'trackplay/players', 'app-page-trackplay-players');

    await createPlayer(page, 'Charlie');
    const row = listRow(page, 'Charlie');
    await expect(row).toBeVisible();

    await slideDelete(row);

    await expect(
      mainContent(page).getByText('Charlie', { exact: true })
    ).toHaveCount(0);

    const undo = page.getByTestId('undo-button');
    await expect(undo).toBeVisible({ timeout: 10_000 });
    await undo.click();

    await expect(
      mainContent(page).getByText('Charlie', { exact: true })
    ).toBeVisible();
    await expect(undo).toHaveCount(0);
  });

  test('keeps players across a full reload (hydration must not clobber storage)', async ({
    page,
  }) => {
    await gotoPage(page, 'trackplay/players', 'app-page-trackplay-players');
    await createPlayer(page, 'Dunkelzahn');
    await waitForPersisted(page, 'trackplay', 'Dunkelzahn');

    await page.reload();
    await expect(
      mainContent(page).locator('app-page-trackplay-players')
    ).toBeVisible({ timeout: 30_000 });

    await expect(listRow(page, 'Dunkelzahn')).toBeVisible();
  });
});
