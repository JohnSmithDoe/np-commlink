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
 * program on first, and the two waits are not interchangeable: `switchOn`
 * waits for the id to ARRIVE in the stored document, `switchOff` for it to
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

const configRow = (page: Page, label: string) =>
  configPage(page).getByTestId('deck-config-row').filter({ hasText: label });

const orderRow = (page: Page, label: string) =>
  configPage(page)
    .getByTestId('deck-config-order-row')
    .filter({ hasText: label });

const moduleHeader = (page: Page, label: string) =>
  configPage(page).getByTestId('deck-config-module').filter({ hasText: label });

const deckTile = (page: Page, codename: string) =>
  page
    .locator('app-page-commlink')
    .getByTestId('deck-tile')
    .filter({ hasText: codename });

const statusStrip = (page: Page) =>
  page.locator('app-page-commlink').getByTestId('deck-status-strip');

const menuRow = (page: Page, label: string) =>
  page.locator('ion-menu').getByTestId('menu-row').filter({ hasText: label });

async function gotoFresh(page: Page, hash: string): Promise<void> {
  await page.goto(`/#/${hash}`);
  await page.reload();
}

async function openDeckConfig(page: Page): Promise<void> {
  await gotoFresh(page, 'commlink/deck');
  await expect(moduleHeader(page, HOUSEHOLD_MODULE)).toBeVisible({
    timeout: 30_000,
  });
  await programRow(page, MARKET);
}

async function openDeck(page: Page): Promise<void> {
  await gotoFresh(page, 'commlink');
  await expect(statusStrip(page)).toBeVisible({ timeout: 30_000 });
}

async function switchOn(
  page: Page,
  label: string,
  marker: string
): Promise<void> {
  await configRow(page, label).getByTestId('deck-config-row-toggle').click();
  await waitForPersisted(page, 'deck', marker);
}

async function switchOff(
  page: Page,
  label: string,
  marker: string
): Promise<void> {
  await configRow(page, label).getByTestId('deck-config-row-toggle').click();
  await waitForPersistedWithout(page, 'deck', marker);
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
    await expect(moduleHeader(page, HOUSEHOLD_MODULE)).toBeVisible();
  });

  test('switching a program on reaches the grid and the side menu', async ({
    page,
  }) => {
    await openDeckConfig(page);
    await switchOn(page, MARKET, '"shopping"');

    await openDeck(page);
    await expect(deckTile(page, MARKET)).toBeVisible();
    await expect(menuRow(page, MARKET)).toHaveCount(1);
    await expect(menuRow(page, MARKET_PAGE_TITLE)).toHaveCount(0);

    await openDeckConfig(page);
    await switchOff(page, MARKET, '"shopping"');

    await openDeck(page);
    await expect(deckTile(page, MARKET)).toHaveCount(0);
    await expect(menuRow(page, MARKET)).toHaveCount(0);
  });

  test('keeps the full program denominator in the status strip', async ({
    page,
  }) => {
    await openDeck(page);
    await expect(statusStrip(page)).toContainText('/21');

    await openDeckConfig(page);
    await switchOn(page, MARKET, '"shopping"');

    await openDeck(page);
    await expect(statusStrip(page)).toContainText('/21');
  });

  test('orders only what is switched on, and names its module', async ({
    page,
  }) => {
    await openDeckConfig(page);
    await openOrderLens(configPage(page));
    await expect(orderRow(page, MARKET)).toHaveCount(0);

    await openDeckConfig(page);
    await switchOn(page, MARKET, '"shopping"');
    await openOrderLens(configPage(page));

    await expect(orderRow(page, MARKET)).toBeVisible();
    await expect(orderRow(page, MARKET)).toContainText(HOUSEHOLD_MODULE);
  });

  test('opens grouped, with a module of many collapsed', async ({ page }) => {
    await gotoFresh(page, 'commlink/deck');
    const household = moduleHeader(page, HOUSEHOLD_MODULE);
    await expect(household).toBeVisible({ timeout: 30_000 });
    await expect(configRow(page, MARKET)).toBeHidden();

    await household.click();
    await expect(configRow(page, MARKET)).toBeVisible();
  });

  test('switches a whole module on from its group header', async ({ page }) => {
    await gotoFresh(page, 'commlink/deck');
    const household = moduleHeader(page, HOUSEHOLD_MODULE);
    await expect(household).toBeVisible({ timeout: 30_000 });

    await household.getByTestId('deck-config-module-toggle').click();
    await waitForPersisted(page, 'deck', '"shopping"');

    await openDeck(page);
    await expect(deckTile(page, MARKET)).toBeVisible();
    await expect(menuRow(page, MARKET)).toHaveCount(1);
  });
});
