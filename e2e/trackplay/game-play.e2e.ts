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

/**
 * The signature end-to-end flow: create two players, create a game (assigning
 * both players + a win-high type via the game-edit dialog), drive the scoring
 * grid across two rounds, verify the footer sums and the auto-spawned trailing
 * round, end the game (winner = higher total for win-high) and reopen it.
 */

/** A player-column footer total cell (skips the leading ∑ marker column). */
function footerCells(grid: Locator): Locator {
  return grid.locator('.tp-row--footer .tp-cell--foot:not(.tp-cell--round)');
}

/** A player-column header cell (skips the leading "#" marker column). */
function headerCells(grid: Locator): Locator {
  return grid.locator('.tp-row--header .tp-cell--head:not(.tp-cell--round)');
}

function dataRows(grid: Locator): Locator {
  return grid.locator('.tp-body .tp-row--data');
}

/** The numeric input of a scoring cell at (round row `r`, player column `c`). */
function cellInput(grid: Locator, r: number, c: number): Locator {
  return dataRows(grid)
    .nth(r)
    .locator('.tp-cell--edit')
    .nth(c)
    .locator('input');
}

/** Type a score into a cell and commit it (Enter blurs → ionBlur → dispatch). */
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
  await gotoTrackplay(page, 'trackplay/players', 'app-trackplay-players-page');
  await createPlayer(page, 'Alice');
  await createPlayer(page, 'Bob');
}

test.describe('trackplay full game', () => {
  test('plays a full game end to end (grid, sums, winner, reopen)', async ({
    page,
  }) => {
    await createTwoPlayers(page);

    // ── Create the game via the games-page dialog ────────────────────────
    await gotoTrackplay(page, 'trackplay', 'app-trackplay-games-page');
    await addButton(pageRoot(page, 'app-trackplay-games-page')).click();

    const dialog = page.locator('app-trackplay-game-edit-dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await dialog.locator('ion-input input').first().fill('Testspiel');
    // Pick Skat (win-high) through the type select.
    await pickSelectOption(page, dialog.locator('ion-select'), 'Skat');
    await togglePlayerInSelect(dialog, 'Alice');
    await togglePlayerInSelect(dialog, 'Bob');

    // "Weiter" resolves the freshly-created game id and navigates to its grid.
    await dialog.getByRole('button', { name: 'Weiter' }).click();
    await expect(page).toHaveURL(/#\/trackplay\/game\//);
    const grid = mainContent(page).locator('app-trackplay-game-play-page');
    await expect(grid).toBeVisible({ timeout: 30_000 });

    // Column order is the game's player order (player-select emits alphabetical).
    await expect(headerCells(grid).nth(0)).toHaveText('Alice');
    await expect(headerCells(grid).nth(1)).toHaveText('Bob');

    // ── Scoring grid: enter two rounds; trailing blank row auto-spawns ────
    await expect(dataRows(grid)).toHaveCount(1); // seeded blank round

    await enterScore(grid, 0, 0, 10); // Alice, round 0
    await expect(dataRows(grid)).toHaveCount(2); // spawned a fresh blank row
    await enterScore(grid, 0, 1, 5); // Bob, round 0

    await enterScore(grid, 1, 0, 20); // Alice, round 1
    await expect(dataRows(grid)).toHaveCount(3); // spawned again
    await enterScore(grid, 1, 1, 15); // Bob, round 1

    // Footer ∑ equals per-player totals.
    await expect(footerCells(grid).nth(0)).toHaveText('30'); // Alice 10+20
    await expect(footerCells(grid).nth(1)).toHaveText('20'); // Bob 5+15

    // ── End the game ─────────────────────────────────────────────────────
    await grid.getByRole('button', { name: 'Beenden' }).click();

    await expect(grid.getByText('Das Spiel ist beendet.')).toBeVisible();

    // Winner is the HIGHER total for a win-high type (Alice 30 > Bob 20).
    const winnerLine = grid.locator('.tp-result__winner');
    await expect(winnerLine).toContainText('Alice');
    await expect(winnerLine).toContainText('hat gewonnen');
    // No unfilled i18n placeholder should leak into the winner line.
    await expect(winnerLine).not.toContainText('{{');
    // Pure-CSS victory HUD (replaced the old winner.gif).
    await expect(grid.locator('.tp-victory')).toBeVisible();

    // ── Reopen (Weiter) returns to the editable grid ─────────────────────
    await grid.getByRole('button', { name: 'Weiter' }).click();
    await expect(grid.locator('.tp-row--footer')).toBeVisible();
    await expect(footerCells(grid).nth(0)).toHaveText('30');
    await expect(dataRows(grid)).toHaveCount(3);
  });
});
