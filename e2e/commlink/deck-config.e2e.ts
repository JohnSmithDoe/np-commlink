/* ─── why ─────────────────────────────────────────────────────────
 * One stored choice has to reach two surfaces — the deck grid and the
 * side menu — and survive a cold launch, so every assertion here is a
 * cold read: `gotoFresh` reloads after each hash navigation, which is
 * also what collapses the outlet back to a single mounted page.
 *
 * Both surfaces render the theme-resolved codename, never the page title,
 * so `MARKET_PAGE_TITLE` is asserted ABSENT from the menu. That is the
 * assertion that a row and its tile cannot disagree.
 *
 * `toggleAndPersist` keys its persistence wait on the hidden entry's id,
 * never on the field name: `hiddenEntries` is in the doc from the first
 * write onwards as `[]`, so waiting for the key would resolve before the
 * write under test had landed.
 *
 * Hiding a program is a navigation choice, not an uninstall, so the
 * status strip keeps reporting the grid's full complement. The `/13` is
 * the whole assertion — the copy around it is i18n and theme-cased, and
 * matching that would pin the translation instead.
 *
 * A module's flag cascades at read time and is never written into its
 * entries, which is what the last test spends: switching HOUSEHOLD off
 * and on again restores what the user configured underneath, so MARKET —
 * hidden on its own — must stay hidden.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { waitForPersisted } from '../helpers';

const MARKET = 'MARKET';
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

  test('keeps the full program denominator in the status strip', async ({
    page,
  }) => {
    await openDeckConfig(page);
    await toggleAndPersist(page, MARKET, 'shopping');

    await openDeck(page);
    await expect(
      page.locator('app-page-commlink').getByTestId('deck-status-strip')
    ).toContainText('/13');
  });

  test('cascades a module without flattening its entries', async ({ page }) => {
    await openDeckConfig(page);
    await toggleAndPersist(page, MARKET, 'shopping');
    await toggleAndPersist(page, HOUSEHOLD_MODULE, 'household');

    await openDeck(page);
    await expect(deckTile(page, 'STASH')).toHaveCount(0);
    await expect(deckTile(page, 'CATALOG')).toHaveCount(0);

    await openDeckConfig(page);
    await toggleAndPersist(page, HOUSEHOLD_MODULE, '"hiddenModules":[]');

    await openDeck(page);
    await expect(deckTile(page, 'STASH')).toBeVisible();
    await expect(deckTile(page, MARKET)).toHaveCount(0);
  });
});
