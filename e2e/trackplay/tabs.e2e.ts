/* ─── why ─────────────────────────────────────────────────────────
 * Every locator here reaches OUTSIDE `pageRoot`: the bar belongs to the
 * module shell, and one that could be found inside a page would be a page
 * that had built its own.
 *
 * The assertions are URLs and mounted page elements rather than Ionic's
 * selected-tab class, which is an implementation detail of the bar and not
 * the behaviour being defended.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { gotoPage, mainContent, pageRoot } from './helpers';

const GAMES_PAGE = 'app-page-trackplay-games';
const DICE_PAGE = 'app-page-trackplay-dice';
const BOARD_PAGE = 'app-page-trackplay-board';
const PLAYERS_PAGE = 'app-page-trackplay-players';

const tabBar = (page: Page) =>
  mainContent(page).getByTestId('module-tabs').first();

const tab = (page: Page, name: string) =>
  tabBar(page).locator(`ion-tab-button[tab="${name}"]`);

test.describe('trackplay module tabs', () => {
  test('opens the games tab from the module root', async ({ page }) => {
    await gotoPage(page, 'trackplay', GAMES_PAGE);

    await expect(page).toHaveURL(/#\/trackplay\/games$/);
    await expect(tabBar(page)).toBeVisible();
    await expect(tabBar(page).locator('ion-tab-button')).toHaveCount(4);
  });

  test('switches between sibling programs without leaving the module', async ({
    page,
  }) => {
    await gotoPage(page, 'trackplay', GAMES_PAGE);

    await tab(page, 'dice').click();
    await expect(pageRoot(page, DICE_PAGE)).toBeVisible({ timeout: 15_000 });

    await tab(page, 'board').click();
    await expect(pageRoot(page, BOARD_PAGE)).toBeVisible({ timeout: 15_000 });

    await tab(page, 'games').click();
    await expect(pageRoot(page, GAMES_PAGE)).toBeVisible({ timeout: 15_000 });
  });

  test('keeps the bar up on a page inside a tab', async ({ page }) => {
    await gotoPage(page, 'trackplay/players', PLAYERS_PAGE);

    await expect(tabBar(page)).toBeVisible();
  });
});
