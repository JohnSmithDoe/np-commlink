/* ─── why ─────────────────────────────────────────────────────────
 * Two switches, not one, and only the second is new. `deck-config-row-toggle`
 * decides whether a program EXISTS for the user at all; the order lens's eye
 * decides only whether it also gets a tile. The pair is what these tests
 * separate — a program taken off the deck has to stay in the drawer, or the
 * eye has silently become the on/off switch.
 *
 * Switching a program off and on again is asserted to CLEAR the tile
 * preference. `hiddenTiles` is a subset of what is switched on, so a
 * preference that outlived its program would come back on a later re-add
 * with nothing on screen naming it.
 *
 * The lens is component state, so a hash navigation back to the config page
 * lands on whichever lens the last step left. Reaching the programs list
 * after touching the order lens needs a reload, not a `goto`.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  enableDeckProgram,
  openOrderLens,
  programRow,
  waitForPersisted,
  waitForPersistedWithout,
} from '../helpers';

const MARKET = 'MARKET';
const AGENDA = 'AGENDA';

const configPage = (page: Page): Locator =>
  page.locator('app-page-deck-config');

const marketOrderRow = (page: Page) => {
  return configPage(page)
    .getByTestId('deck-config-order-row')
    .filter({ hasText: MARKET });
};

const menuRow = (page: Page, label: string) =>
  page.locator('ion-menu').getByTestId('menu-row').filter({ hasText: label });

const codenames = (page: Page) => {
  return page
    .locator('app-page-commlink')
    .getByTestId('deck-tile')
    .getByTestId('deck-tile-name');
};

async function openDeck(page: Page): Promise<void> {
  await page.goto('/#/commlink');
  await expect(
    page.locator('app-page-commlink').getByTestId('deck-status-strip')
  ).toBeVisible({ timeout: 30_000 });
}

async function takeMarketOffDeck(page: Page): Promise<void> {
  await page.goto('/#/settings/deck');
  await expect(configPage(page).getByTestId('deck-config-lens')).toBeVisible({
    timeout: 30_000,
  });
  await openOrderLens(configPage(page));
  await marketOrderRow(page).getByTestId('deck-config-tile-toggle').click();
  await waitForPersisted(page, 'deck', '"hiddenTiles":["');
}

test.describe('taking a program off the deck', () => {
  test.beforeEach(async ({ page }) => {
    await enableDeckProgram(page, MARKET, 'shopping');
    await enableDeckProgram(page, AGENDA, 'tasks');
  });

  test('drops its tile but keeps its row in the order lens', async ({
    page,
  }) => {
    await takeMarketOffDeck(page);
    await expect(marketOrderRow(page)).toHaveCount(1);

    await openDeck(page);
    await expect(codenames(page)).toHaveText([AGENDA]);
  });

  test('leaves it in the drawer, so it is still reachable', async ({
    page,
  }) => {
    await takeMarketOffDeck(page);

    await openDeck(page);
    await expect(menuRow(page, MARKET)).toHaveCount(1);
  });

  test('survives a reload, and the eye puts it back', async ({ page }) => {
    await takeMarketOffDeck(page);
    await openDeck(page);
    await page.reload();
    await expect(codenames(page)).toHaveText([AGENDA]);

    await page.goto('/#/settings/deck');
    await openOrderLens(configPage(page));
    await marketOrderRow(page).getByTestId('deck-config-tile-toggle').click();
    await waitForPersisted(page, 'deck', '"hiddenTiles":[]');

    await openDeck(page);
    await expect(codenames(page)).toHaveText([MARKET, AGENDA]);
  });

  test('forgets the choice once the program is switched off and on', async ({
    page,
  }) => {
    await takeMarketOffDeck(page);

    await page.goto('/#/settings/deck');
    await page.reload();
    await expect(configPage(page).getByTestId('deck-config-lens')).toBeVisible({
      timeout: 30_000,
    });
    const row = await programRow(page, MARKET);
    await row.getByTestId('deck-config-row-toggle').click();
    await waitForPersistedWithout(page, 'deck', '"shopping"');
    await enableDeckProgram(page, MARKET, 'shopping');

    await openDeck(page);
    await expect(codenames(page)).toHaveText([MARKET, AGENDA]);
  });
});
