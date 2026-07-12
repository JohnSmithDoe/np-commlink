import { expect, test } from '@playwright/test';
import { createPlayer, gotoTrackplay, mainContent, slideDelete } from './helpers';

/**
 * Player CRUD through the players page: create two players via the dialog, and
 * delete a player via the swipe option — asserting the undo toast appears and
 * that tapping "Rückgängig" restores the player.
 */
test.describe('trackplay players', () => {
  test('creates two players via the dialog', async ({ page }) => {
    await gotoTrackplay(
      page,
      'trackplay/players',
      'app-trackplay-players-page'
    );

    await createPlayer(page, 'Alice');
    await createPlayer(page, 'Bob');

    const rows = mainContent(page).locator('app-trackplay-player-list-item');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'Alice' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Bob' })).toBeVisible();
  });

  test('deletes a player and restores it via the undo toast', async ({
    page,
  }) => {
    await gotoTrackplay(
      page,
      'trackplay/players',
      'app-trackplay-players-page'
    );

    await createPlayer(page, 'Charlie');
    const row = mainContent(page)
      .locator('app-trackplay-player-list-item')
      .filter({ hasText: 'Charlie' });
    await expect(row).toBeVisible();

    await slideDelete(row);

    // Row gone, undo toast raised.
    await expect(
      mainContent(page).getByText('Charlie', { exact: true })
    ).toHaveCount(0);
    const toast = page.locator('ion-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Charlie');

    // Undo restores the player.
    await toast.getByRole('button', { name: 'Rückgängig' }).click();
    await expect(
      mainContent(page).getByText('Charlie', { exact: true })
    ).toBeVisible();
  });
});
