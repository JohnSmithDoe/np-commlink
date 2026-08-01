import { expect, Page, test } from '@playwright/test';
import {
  addViaSearch,
  gotoFeature,
  mainContent,
  ROUTE,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

/**
 * Acceptance test for the persisted dashboard read-model (lazy-modules plan
 * §3). The MARKET tile's metric comes from the **lazy** shopping slice, so at a
 * cold launch on the deck — where shopping is never loaded and its reporter
 * never fires — the only possible source of the number is the persisted
 * `npc-summary-shopping` doc. This proves the whole persist → cold-hydrate path.
 */

/** The deck tile whose codename matches, scoped to the routed content. */
function tile(page: Page, codename: string) {
  return mainContent(page)
    .getByTestId('deck-tile')
    .filter({ hasText: codename });
}

test.describe('commlink cold launch', () => {
  test('shows a persisted grocery metric with no module route visited', async ({
    page,
  }) => {
    // 1. Seed: visiting the lazy shopping route registers its reporter, which
    //    pushes { active: 2 } → persistSummary$ writes npc-summary-shopping.
    await gotoFeature(page, ROUTE.shopping);
    await addViaSearch(page, 'Milk');
    await addViaSearch(page, 'Bread');
    await waitForPersisted(page, 'summary-shopping');

    // 2. Cold launch: full reload landing on the deck. The read-model starts
    //    empty and must hydrate from disk; shopping is NOT loaded here.
    await page.goto('/#/commlink');
    await page.reload();

    // 3. The MARKET badge shows the persisted count — only the summary doc
    //    could supply it (the shopping slice/reporter are absent on this route).
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

    // Open the module (lazy reporter registers, reports live) and add an item.
    await gotoFeature(page, ROUTE.shopping);
    await addViaSearch(page, 'Eggs');
    await waitForListPage(page);

    // Back to the deck (SPA nav — read-model kept): the tile reflects the live
    // count, overriding the cold summary.
    await page.goto('/#/commlink');
    await expect(
      tile(page, 'MARKET').getByTestId('deck-tile-badge')
    ).toHaveText('3');
  });
});
