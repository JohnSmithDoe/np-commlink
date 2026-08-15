/* ─── why ─────────────────────────────────────────────────────────
 * The undo toast is located by its own id rather than by `ion-toast`,
 * because the shell mounts a toast of its own — the service-worker update
 * prompt — and an inline overlay sits in the DOM whether presented or
 * not. The element name is therefore ambiguous app-wide, not just here.
 *
 * The reload test guards silent data loss: on re-entry the route
 * registers the slice at empty `initialState` and the resolver dispatches
 * `[Trackplay] load`, which the save effect must exclude or it writes
 * that empty slice over the saved player before the load effect reads it
 * back.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { listRow, slideDelete, waitForPersisted } from '../helpers';
import { createPlayer, gotoTrackplay, mainContent } from './helpers';

test.describe('trackplay players', () => {
  test('creates two players via the dialog', async ({ page }) => {
    await gotoTrackplay(
      page,
      'trackplay/players',
      'app-page-trackplay-players'
    );

    await createPlayer(page, 'Alice');
    await createPlayer(page, 'Bob');

    await expect(mainContent(page).getByTestId('list-row')).toHaveCount(2);
    await expect(listRow(page, 'Alice')).toBeVisible();
    await expect(listRow(page, 'Bob')).toBeVisible();
  });

  test('deletes a player and restores it via the undo toast', async ({
    page,
  }) => {
    await gotoTrackplay(
      page,
      'trackplay/players',
      'app-page-trackplay-players'
    );

    await createPlayer(page, 'Charlie');
    const row = listRow(page, 'Charlie');
    await expect(row).toBeVisible();

    await slideDelete(row);

    await expect(
      mainContent(page).getByText('Charlie', { exact: true })
    ).toHaveCount(0);
    const toast = page.getByTestId('action-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Charlie');

    await toast.getByRole('button', { name: 'Rückgängig' }).click();
    await expect(
      mainContent(page).getByText('Charlie', { exact: true })
    ).toBeVisible();
  });

  test('keeps players across a full reload (hydration must not clobber storage)', async ({
    page,
  }) => {
    await gotoTrackplay(
      page,
      'trackplay/players',
      'app-page-trackplay-players'
    );
    await createPlayer(page, 'Dunkelzahn');
    await waitForPersisted(page, 'trackplay', 'Dunkelzahn');

    await page.reload();
    await expect(
      mainContent(page).locator('app-page-trackplay-players')
    ).toBeVisible({ timeout: 30_000 });

    await expect(listRow(page, 'Dunkelzahn')).toBeVisible();
  });
});
