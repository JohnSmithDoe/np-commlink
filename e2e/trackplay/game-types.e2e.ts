import { expect, test } from '@playwright/test';
import { gotoTrackplay, mainContent } from './helpers';

/**
 * Create a new game type through its dialog (name + win-high toggle) and verify
 * it lands in the list with the correct win-high / win-low label.
 */
test.describe('trackplay game types', () => {
  test('creates a win-low game type via the dialog', async ({ page }) => {
    await gotoTrackplay(
      page,
      'trackplay/game-types',
      'app-page-trackplay-game-types'
    );

    await mainContent(page)
      .getByRole('button', { name: 'Neue Spielart anlegen' })
      .click();

    const dialog = page.locator('app-trackplay-game-type-edit-modal');
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await dialog.locator('ion-input input').first().fill('Doppelkopf');
    // Default toggle is win-high (checked); flip it to make a win-low type.
    await dialog.locator('ion-toggle').click();
    await dialog.getByRole('button', { name: 'OK' }).click();
    await expect(dialog).toBeHidden();

    const newRow = mainContent(page)
      .locator('app-trackplay-game-type-list-item')
      .filter({ hasText: 'Doppelkopf' });
    await expect(newRow).toBeVisible();
    await expect(newRow).toContainText('Niedrigste Punktzahl gewinnt');
  });

  test('creates a win-high game type via the dialog', async ({ page }) => {
    await gotoTrackplay(
      page,
      'trackplay/game-types',
      'app-page-trackplay-game-types'
    );

    await mainContent(page)
      .getByRole('button', { name: 'Neue Spielart anlegen' })
      .click();

    const dialog = page.locator('app-trackplay-game-type-edit-modal');
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await dialog.locator('ion-input input').first().fill('Canasta');
    // Leave the toggle in its default (win-high) state.
    await dialog.getByRole('button', { name: 'OK' }).click();
    await expect(dialog).toBeHidden();

    const newRow = mainContent(page)
      .locator('app-trackplay-game-type-list-item')
      .filter({ hasText: 'Canasta' });
    await expect(newRow).toBeVisible();
    await expect(newRow).toContainText('Höchste Punktzahl gewinnt');
  });
});
