import { expect, test } from '@playwright/test';
import { gotoTrackplay, headerTitle, mainContent } from './helpers';

/**
 * Smoke tests that each trackplay route paints its page shell (German header
 * inside #main-content), that the game-types list seeds Standard / Rommé / Skat,
 * and that the built-in Standard type exposes no delete slide-option.
 */
test.describe('trackplay first paint', () => {
  test('paints the games (Spiele) home page', async ({ page }) => {
    await gotoTrackplay(page, 'trackplay', 'app-trackplay-games-page');
    await expect(headerTitle(page)).toHaveText('Spiele');
  });

  test('paints the players (Spieler) page', async ({ page }) => {
    await gotoTrackplay(
      page,
      'trackplay/players',
      'app-trackplay-players-page'
    );
    await expect(headerTitle(page)).toHaveText('Spieler');
  });

  test('paints the game-types (Spielarten) page and seeds the 3 defaults', async ({
    page,
  }) => {
    await gotoTrackplay(
      page,
      'trackplay/game-types',
      'app-trackplay-game-types-page'
    );
    await expect(headerTitle(page)).toHaveText('Spielarten');

    const content = mainContent(page);
    await expect(content.getByText('Standard', { exact: true })).toBeVisible();
    await expect(content.getByText('Rommé', { exact: true })).toBeVisible();
    await expect(content.getByText('Skat', { exact: true })).toBeVisible();
  });

  test('does not offer a delete option on the built-in Standard type', async ({
    page,
  }) => {
    await gotoTrackplay(
      page,
      'trackplay/game-types',
      'app-trackplay-game-types-page'
    );

    const rows = mainContent(page).locator('app-trackplay-game-type-list-item');
    const standardRow = rows.filter({ hasText: 'Standard' });
    const rommeeRow = rows.filter({ hasText: 'Rommé' });

    // Standard is undeletable — its row renders no leading (delete) options…
    await expect(
      standardRow.locator('ion-item-options[side="start"]')
    ).toHaveCount(0);
    // …while a deletable type (Rommé) does.
    await expect(
      rommeeRow.locator('ion-item-options[side="start"]')
    ).toHaveCount(1);
  });
});
