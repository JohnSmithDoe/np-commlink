/* ─── why ─────────────────────────────────────────────────────────
 * The signature flow, and the only place the scoring grid is driven as a
 * grid rather than as a reducer.
 *
 * `.nth(index)` is right throughout: a column IS a player and a row IS a
 * round. Both cell helpers skip a leading marker column — the `#` in the
 * header, the `∑` in the footer — so index 0 is Alice because the
 * player-select emits alphabetically and the game keeps that order, not
 * because of where the DOM happens to start.
 *
 * A score commits on blur, so `enterScore` presses Enter: that is what
 * raises `ionBlur` and dispatches. The grid answers by spawning a fresh
 * trailing blank round, which is why every entry is followed by a row
 * count.
 *
 * Skat is picked because it is win-HIGH, which makes Alice's 30 the
 * winning total — the assertion would invert for a win-low type. The
 * `not.toContainText('{{')` beside it catches an unfilled i18n
 * placeholder leaking into the winner line, which every other assertion
 * here would read as a pass.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  addButton,
  createPlayer,
  gotoTrackplay,
  mainContent,
  pageRoot,
  pickSelectOption,
  togglePlayerInSelect,
} from './helpers';

function footerCells(grid: Locator): Locator {
  return grid.getByTestId('score-total-cell');
}

function headerCells(grid: Locator): Locator {
  return grid.getByTestId('score-header-cell');
}

function dataRows(grid: Locator): Locator {
  return grid.getByTestId('score-row');
}

function cellInput(grid: Locator, r: number, c: number): Locator {
  return dataRows(grid)
    .nth(r)
    .getByTestId('score-cell')
    .nth(c)
    .locator('input');
}

async function enterScore(
  grid: Locator,
  r: number,
  c: number,
  value: number
): Promise<void> {
  const input = cellInput(grid, r, c);
  await input.click();
  await input.fill(String(value));
  await input.press('Enter');
}

async function createTwoPlayers(page: Page): Promise<void> {
  await gotoTrackplay(page, 'trackplay/players', 'app-page-trackplay-players');
  await createPlayer(page, 'Alice');
  await createPlayer(page, 'Bob');
}

test.describe('trackplay full game', () => {
  test('plays a full game end to end (grid, sums, winner, reopen)', async ({
    page,
  }) => {
    await createTwoPlayers(page);

    await gotoTrackplay(page, 'trackplay', 'app-page-trackplay-games');
    await addButton(pageRoot(page, 'app-page-trackplay-games')).click();

    const dialog = page.locator('app-trackplay-game-edit-modal');
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await dialog
      .getByTestId('game-name-input')
      .locator('input')
      .fill('Testspiel');
    await pickSelectOption(
      page,
      dialog.getByTestId('game-type-select'),
      'Skat'
    );
    await togglePlayerInSelect(dialog, 'Alice');
    await togglePlayerInSelect(dialog, 'Bob');

    await dialog.getByRole('button', { name: 'Weiter' }).click();
    await expect(page).toHaveURL(/#\/trackplay\/game\//);
    const grid = mainContent(page).locator('app-page-trackplay-game-play');
    await expect(grid).toBeVisible({ timeout: 30_000 });

    await expect(headerCells(grid).nth(0)).toHaveText('Alice');
    await expect(headerCells(grid).nth(1)).toHaveText('Bob');

    await expect(dataRows(grid)).toHaveCount(1); // seeded blank round

    await enterScore(grid, 0, 0, 10); // Alice, round 0
    await expect(dataRows(grid)).toHaveCount(2); // spawned a fresh blank row
    await enterScore(grid, 0, 1, 5); // Bob, round 0

    await enterScore(grid, 1, 0, 20); // Alice, round 1
    await expect(dataRows(grid)).toHaveCount(3); // spawned again
    await enterScore(grid, 1, 1, 15); // Bob, round 1

    await expect(footerCells(grid).nth(0)).toHaveText('30'); // Alice 10+20
    await expect(footerCells(grid).nth(1)).toHaveText('20'); // Bob 5+15

    await grid.getByRole('button', { name: 'Beenden' }).click();

    await expect(grid.getByText('Das Spiel ist beendet.')).toBeVisible();

    const winnerLine = grid.getByTestId('game-winner');
    await expect(winnerLine).toContainText('Alice');
    await expect(winnerLine).toContainText('hat gewonnen');
    await expect(winnerLine).not.toContainText('{{');
    await expect(grid.getByTestId('game-victory-art')).toBeVisible();

    await grid.getByRole('button', { name: 'Weiter' }).click();
    await expect(grid.getByTestId('score-total-row')).toBeVisible();
    await expect(footerCells(grid).nth(0)).toHaveText('30');
    await expect(dataRows(grid)).toHaveCount(3);
  });
});
