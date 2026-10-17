/* ─── why ─────────────────────────────────────────────────────────
 * One stored choice has to reach two surfaces — the deck grid and the
 * side menu — and survive a cold launch, so every assertion here is a
 * cold read: `gotoFresh` reloads after each hash navigation, which is
 * also what collapses the outlet back to a single mounted page.
 *
 * Both surfaces render the theme-resolved codename, never the page title,
 * so `MARKET_PAGE_TITLE` is asserted ABSENT from the menu — the assertion
 * that a row and its tile cannot disagree.
 *
 * A cold deck ships EMPTY, so every test that needs a tile switches its
 * program on first, and the two waits are not interchangeable: `switchMarketOn`
 * waits for the id to ARRIVE in the stored document, `switchMarketOff` for it to
 * leave. Waiting on the field name would resolve against a previous write.
 *
 * `openDeck` anchors on the status strip, the one element the grid renders
 * whatever the configuration says — never on a tile a step just hid.
 *
 * Hiding a program is a navigation choice, not an uninstall, so the
 * status strip keeps reporting the grid's full complement — it counts
 * `onDeck` entries in the catalog, which is why an empty deck still
 * reports twenty-one, and why that literal is re-read when the catalog
 * gains an entry. Only the denominator is asserted, because the copy
 * around it is theme-cased.
 *
 * The order lens lists what is ON, so a test about ordering has to
 * switch something on first — it cannot start there.
 *
 * The empty node is asserted CLICKABLE, not just present: it is the only
 * route out of the PAGE and the first thing a new install shows, so a
 * decorative empty state would strand the home screen.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  openOrderLens,
  programRow,
  waitForPersisted,
  waitForPersistedWithout,
} from '../helpers';

const MARKET = 'MARKET';
const MARKET_PAGE_TITLE = 'Einkaufsliste';
const HOUSEHOLD_MODULE = 'Haushalt';

const configPage = (page: Page): Locator =>
  page.locator('app-page-deck-config');

const marketConfigRow = (page: Page) =>
  configPage(page).getByTestId('deck-config-row').filter({ hasText: MARKET });

const marketOrderRow = (page: Page) => {
  return configPage(page)
    .getByTestId('deck-config-order-row')
    .filter({ hasText: MARKET });
};

const householdHeader = (page: Page) => {
  return configPage(page)
    .getByTestId('deck-config-module')
    .filter({ hasText: HOUSEHOLD_MODULE });
};

const marketTile = (page: Page) => {
  return page
    .locator('app-page-commlink')
    .getByTestId('deck-tile')
    .filter({ hasText: MARKET });
};

const statusStrip = (page: Page) =>
  page.locator('app-page-commlink').getByTestId('deck-status-strip');

const menuRow = (page: Page, label: string) =>
  page.locator('ion-menu').getByTestId('menu-row').filter({ hasText: label });

async function gotoFresh(page: Page, hash: string): Promise<void> {
  await page.goto(`/#/${hash}`);
  await page.reload();
}

async function openDeckConfig(page: Page): Promise<void> {
  await gotoFresh(page, 'settings/deck');
  await expect(householdHeader(page)).toBeVisible({
    timeout: 30_000,
  });
  await programRow(page, MARKET);
}

async function openDeck(page: Page): Promise<void> {
  await gotoFresh(page, 'commlink');
  await expect(statusStrip(page)).toBeVisible({ timeout: 30_000 });
}

const MARKET_ENTRY = '"shopping"';

async function switchMarketOn(page: Page): Promise<void> {
  await marketConfigRow(page).getByTestId('deck-config-row-toggle').click();
  await waitForPersisted(page, 'deck', MARKET_ENTRY);
}

async function switchMarketOff(page: Page): Promise<void> {
  await marketConfigRow(page).getByTestId('deck-config-row-toggle').click();
  await waitForPersistedWithout(page, 'deck', MARKET_ENTRY);
}

test.describe('deck configuration', () => {
  test('ships an empty deck that offers its own way in', async ({ page }) => {
    await gotoFresh(page, 'commlink');
    const deck = page.locator('app-page-commlink');
    await expect(deck.getByTestId('deck-empty')).toBeVisible({
      timeout: 30_000,
    });
    await expect(deck.getByTestId('deck-tile')).toHaveCount(0);

    await deck.getByTestId('deck-empty').click();
    await expect(householdHeader(page)).toBeVisible();
  });

  test('switching a program on reaches the grid and the side menu', async ({
    page,
  }) => {
    await openDeckConfig(page);
    await switchMarketOn(page);

    await openDeck(page);
    await expect(marketTile(page)).toBeVisible();
    await expect(menuRow(page, MARKET)).toHaveCount(1);
    await expect(menuRow(page, MARKET_PAGE_TITLE)).toHaveCount(0);

    await openDeckConfig(page);
    await switchMarketOff(page);

    await openDeck(page);
    await expect(marketTile(page)).toHaveCount(0);
    await expect(menuRow(page, MARKET)).toHaveCount(0);
  });

  test('keeps the full program denominator in the status strip', async ({
    page,
  }) => {
    await openDeck(page);
    const strip = await statusStrip(page).textContent();
    const denominator = strip?.match(/\d+\/(\d+)/)?.[1];
    expect(Number(denominator)).toBeGreaterThan(1);

    await openDeckConfig(page);
    await switchMarketOn(page);

    await openDeck(page);
    await expect(statusStrip(page)).toContainText(`/${denominator}`);
  });

  test('orders only what is switched on, and names its module', async ({
    page,
  }) => {
    await openDeckConfig(page);
    await openOrderLens(configPage(page));
    await expect(marketOrderRow(page)).toHaveCount(0);

    await openDeckConfig(page);
    await switchMarketOn(page);
    await openOrderLens(configPage(page));

    await expect(marketOrderRow(page)).toBeVisible();
    await expect(marketOrderRow(page)).toContainText(HOUSEHOLD_MODULE);
  });

  test('opens grouped, with a module of many collapsed', async ({ page }) => {
    await gotoFresh(page, 'settings/deck');
    const household = householdHeader(page);
    await expect(household).toBeVisible({ timeout: 30_000 });
    await expect(marketConfigRow(page)).toBeHidden();

    await household.click();
    await expect(marketConfigRow(page)).toBeVisible();
  });

  test('switches a whole module on from its group header', async ({ page }) => {
    await gotoFresh(page, 'settings/deck');
    const household = householdHeader(page);
    await expect(household).toBeVisible({ timeout: 30_000 });

    await household.getByTestId('deck-config-module-toggle').click();
    await waitForPersisted(page, 'deck', '"shopping"');

    await openDeck(page);
    await expect(marketTile(page)).toBeVisible();
    await expect(menuRow(page, MARKET)).toHaveCount(1);
  });
});
