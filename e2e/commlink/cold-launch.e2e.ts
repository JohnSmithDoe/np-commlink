/* ─── why ─────────────────────────────────────────────────────────
 * The MARKET tile's number comes from the LAZY shopping slice, so on a
 * cold launch that lands on the deck the slice is never registered and
 * its reporter never fires. The only thing that can supply the badge is
 * the persisted `npc-summary-shopping` doc — which is what makes this the
 * acceptance test for the whole persist → cold-hydrate path rather than a
 * tile-rendering test.
 *
 * The second test asserts the precedence the other way round: once the
 * module IS opened, its live report supersedes the cold summary, and
 * returning to the deck by SPA navigation keeps the read-model instead of
 * re-reading disk.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import {
  addViaSearch,
  gotoFeature,
  mainContent,
  ROUTE,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

function tile(page: Page, codename: string) {
  return mainContent(page)
    .getByTestId('deck-tile')
    .filter({ hasText: codename });
}

test.describe('commlink cold launch', () => {
  test('shows a persisted household metric with no module route visited', async ({
    page,
  }) => {
    await gotoFeature(page, ROUTE.shopping);
    await addViaSearch(page, 'Milk');
    await addViaSearch(page, 'Bread');
    await waitForPersisted(page, 'summary-shopping');

    await page.goto('/#/commlink');
    await page.reload();

    await expect(
      tile(page, 'MARKET').getByTestId('deck-tile-badge')
    ).toHaveText('2');
  });

  test('reconciles the tile to the live count when the module is opened', async ({
    page,
  }) => {
    await gotoFeature(page, ROUTE.shopping);
    await addViaSearch(page, 'Milk');
    await addViaSearch(page, 'Bread');
    await waitForPersisted(page, 'summary-shopping');

    await page.goto('/#/commlink');
    await page.reload();
    await expect(
      tile(page, 'MARKET').getByTestId('deck-tile-badge')
    ).toHaveText('2');

    await gotoFeature(page, ROUTE.shopping);
    await addViaSearch(page, 'Eggs');
    await waitForListPage(page);

    await page.goto('/#/commlink');
    await expect(
      tile(page, 'MARKET').getByTestId('deck-tile-badge')
    ).toHaveText('3');
  });
});
