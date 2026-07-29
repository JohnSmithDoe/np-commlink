import { expect, Page, test } from '@playwright/test';
import { waitForPersisted } from '../helpers';

/**
 * Acceptance test for the configurable deck: one stored choice has to reach two
 * surfaces — the deck grid and the side menu — and survive a cold launch.
 *
 * Every navigation here goes through `gotoFresh`, i.e. a real reload. Hash
 * routing makes `page.goto` a same-document navigation, and the outlet keeps
 * each page it has already shown mounted — so re-entering a route a second time
 * leaves TWO `app-page-deck-config` instances in the DOM and every row locator
 * becomes a strict-mode violation. Reloading also makes each assertion a cold
 * read of the persisted config rather than of the live store, which is the
 * stronger claim anyway.
 */

const MARKET = 'MARKET';
// The page title, which the menu deliberately no longer shows: both surfaces
// render the theme-resolved codename, so a row and its tile cannot disagree.
const MARKET_PAGE_TITLE = 'Einkaufsliste';
const HOUSEHOLD_MODULE = 'Haushalt';

const configRow = (page: Page, label: string) =>
  page
    .locator('app-page-deck-config')
    .getByTestId('deck-config-row')
    .filter({ hasText: label });

const deckTile = (page: Page, codename: string) =>
  page
    .locator('app-page-commlink')
    .getByTestId('deck-tile')
    .filter({ hasText: codename });

const menuRow = (page: Page, label: string) =>
  page.locator('ion-menu').getByTestId('menu-row').filter({ hasText: label });

async function gotoFresh(page: Page, hash: string): Promise<void> {
  await page.goto(`/#/${hash}`);
  await page.reload();
}

async function openDeckConfig(page: Page): Promise<void> {
  await gotoFresh(page, 'commlink/deck');
  await expect(configRow(page, MARKET)).toBeVisible({ timeout: 30_000 });
}

async function openDeck(page: Page): Promise<void> {
  await gotoFresh(page, 'commlink');
  await expect(deckTile(page, 'CHRONO')).toBeVisible({ timeout: 30_000 });
}

/**
 * The marker is the hidden *id*, not the field name: `hiddenEntries` is in the
 * doc from the first write onwards (as `[]`), so keying on it would resolve
 * before the write under test had landed.
 */
async function toggleAndPersist(
  page: Page,
  label: string,
  marker: string
): Promise<void> {
  await configRow(page, label).getByTestId('deck-config-row-toggle').click();
  await waitForPersisted(page, 'deck', marker);
}

test.describe('deck configuration', () => {
  test('hiding a program removes it from the grid and the side menu', async ({
    page,
  }) => {
    await openDeck(page);
    await expect(deckTile(page, MARKET)).toBeVisible();
    await expect(menuRow(page, MARKET)).toHaveCount(1);
    await expect(menuRow(page, MARKET_PAGE_TITLE)).toHaveCount(0);

    await openDeckConfig(page);
    await toggleAndPersist(page, MARKET, 'shopping');

    await openDeck(page);
    await expect(deckTile(page, MARKET)).toHaveCount(0);
    await expect(menuRow(page, MARKET)).toHaveCount(0);
  });

  // Hiding is a navigation choice, not an uninstall, so the readout keeps
  // reporting the grid's full complement rather than this user's view of it.
  test('keeps the full program denominator in the status strip', async ({
    page,
  }) => {
    await openDeckConfig(page);
    await toggleAndPersist(page, MARKET, 'shopping');

    await openDeck(page);
    // The denominator is what this asserts — the surrounding copy is i18n and
    // theme-cased, so matching it would pin the translation instead.
    await expect(
      page.locator('app-page-commlink').getByTestId('deck-status-strip')
    ).toContainText('/13');
  });

  // The module flag cascades on read and is never written into its entries, so
  // switching a module off and on again restores the per-entry configuration.
  test('cascades a module without flattening its entries', async ({ page }) => {
    await openDeckConfig(page);
    await toggleAndPersist(page, MARKET, 'shopping');
    await toggleAndPersist(page, HOUSEHOLD_MODULE, 'groceries');

    await openDeck(page);
    await expect(deckTile(page, 'STASH')).toHaveCount(0);
    await expect(deckTile(page, 'CATALOG')).toHaveCount(0);

    await openDeckConfig(page);
    await toggleAndPersist(page, HOUSEHOLD_MODULE, '"hiddenModules":[]');

    await openDeck(page);
    await expect(deckTile(page, 'STASH')).toBeVisible();
    // MARKET was hidden on its own, so the module coming back must not show it.
    await expect(deckTile(page, MARKET)).toHaveCount(0);
  });
});
