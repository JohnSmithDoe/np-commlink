/* ─── why ─────────────────────────────────────────────────────────
 * The three game types these tests find are the reducer's, not the
 * spec's: a fresh context has no players and no games, but Standard,
 * Rommé and Skat exist from `loaded` onwards.
 *
 * Standard is undeletable by domain rule, so its row renders no leading
 * options at all. Rommé is asserted beside it as the positive control —
 * without one, a locator that had simply stopped matching would read as a
 * pass.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { listRow } from '../helpers';
import { gotoTrackplay, headerTitle, mainContent, pageRoot } from './helpers';

test.describe('trackplay first paint', () => {
  test('paints the games (Spiele) home page', async ({ page }) => {
    await gotoTrackplay(page, 'trackplay', 'app-page-trackplay-games');
    await expect(
      headerTitle(pageRoot(page, 'app-page-trackplay-games'))
    ).toHaveText('Spiele');
  });

  test('paints the players (Spieler) page', async ({ page }) => {
    await gotoTrackplay(
      page,
      'trackplay/players',
      'app-page-trackplay-players'
    );
    await expect(
      headerTitle(pageRoot(page, 'app-page-trackplay-players'))
    ).toHaveText('Spieler');
  });

  test('paints the game-types (Spielarten) page and seeds the 3 defaults', async ({
    page,
  }) => {
    await gotoTrackplay(
      page,
      'trackplay/game-types',
      'app-page-trackplay-game-types'
    );
    await expect(
      headerTitle(pageRoot(page, 'app-page-trackplay-game-types'))
    ).toHaveText('Spielarten');

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
      'app-page-trackplay-game-types'
    );

    const standardRow = listRow(page, 'Standard');
    const rommeeRow = listRow(page, 'Rommé');

    await expect(
      standardRow.getByTestId('list-row-delete-options')
    ).toHaveCount(0);
    await expect(rommeeRow.getByTestId('list-row-delete-options')).toHaveCount(
      1
    );
  });
});
