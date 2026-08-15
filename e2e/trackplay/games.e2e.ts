/* ─── why ─────────────────────────────────────────────────────────
 * Both cases assert the list NARROWS and then WIDENS again. A filter that
 * never applied and a filter that applied but could not be cleared read
 * identically from a single-direction assertion, and the second is the
 * failure a user actually hits.
 *
 * The game is created through the dialog rather than the searchbar's
 * Enter, because only the dialog can put it on a non-default type — which
 * is the whole point of the chip case.
 *
 * Every game gets a player: a game with an empty roster renders a DISABLED
 * row, so the ended case could never open the one it needs to end.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { listRow } from '../helpers';
import {
  CREATE_BUTTON,
  addButton,
  createDialog,
  createPlayer,
  gotoTrackplay,
  mainContent,
  nameBox,
  pageRoot,
  pickSelectOption,
  togglePlayerInSelect,
} from './helpers';

async function createGame(page: Page, name: string, type: string) {
  await addButton(pageRoot(page, 'app-page-trackplay-games')).click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await nameBox(dialog).fill(name);
  await pickSelectOption(page, dialog.getByTestId('game-type-select'), type);
  await togglePlayerInSelect(dialog, 'Alice');
  await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
  await expect(dialog).toBeHidden();
  await expect(listRow(page, name)).toBeVisible();
}

test.describe('trackplay games', () => {
  test.beforeEach(async ({ page }) => {
    await gotoTrackplay(
      page,
      'trackplay/players',
      'app-page-trackplay-players'
    );
    await createPlayer(page, 'Alice');

    await gotoTrackplay(page, 'trackplay', 'app-page-trackplay-games');
    await createGame(page, 'Skatrunde', 'Skat');
    await createGame(page, 'Rommérunde', 'Rommé');
  });

  test('narrows the list to one game type, and widens it again', async ({
    page,
  }) => {
    const counter = mainContent(page).getByTestId('games-count');
    await expect(counter).toContainText('2 / 2');

    const chip = page
      .locator('app-category-filter-bar ion-button')
      .filter({ hasText: 'Skat' });
    await chip.click();

    await expect(listRow(page, 'Skatrunde')).toBeVisible();
    await expect(listRow(page, 'Rommérunde')).toHaveCount(0);
    await expect(counter).toContainText('1 / 2');

    await chip.click();

    await expect(listRow(page, 'Rommérunde')).toBeVisible();
    await expect(counter).toContainText('2 / 2');
  });

  test('hides ended games on request, and brings them back', async ({
    page,
  }) => {
    await listRow(page, 'Skatrunde').click();
    const grid = mainContent(page).locator('app-page-trackplay-game-play');
    await expect(grid).toBeVisible({ timeout: 30_000 });
    await grid.getByRole('button', { name: 'Beenden' }).click();
    await expect(grid.getByText('Das Spiel ist beendet.')).toBeVisible();

    await gotoTrackplay(page, 'trackplay', 'app-page-trackplay-games');
    await expect(listRow(page, 'Skatrunde')).toBeVisible();

    const toggle = mainContent(page).getByTestId('games-show-ended');
    await toggle.click();

    await expect(listRow(page, 'Skatrunde')).toHaveCount(0);
    await expect(listRow(page, 'Rommérunde')).toBeVisible();

    await toggle.click();

    await expect(listRow(page, 'Skatrunde')).toBeVisible();
  });
});
