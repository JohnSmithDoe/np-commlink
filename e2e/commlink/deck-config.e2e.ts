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
 * A cold deck ships EMPTY, so every test that needs a tile switches its
 * program on first, and the two waits are not interchangeable: `switchOn`
 * waits for the id to ARRIVE in the stored document, `switchOff` for it
 * to leave. Waiting on the field name would resolve against a previous
 * write — `visibleEntries` is in the doc from the first one onwards.
 *
 * `openDeck` anchors on the status strip rather than on any tile: it is
 * the one element the grid renders whatever the configuration says, so it
 * cannot wait for something a previous step just hid.
 *
 * Hiding a program is a navigation choice, not an uninstall, so the
 * status strip keeps reporting the grid's full complement — it counts
 * `onDeck` entries in the catalog, which is why an empty deck still
 * reports fifteen, and why that literal is re-read when the catalog gains
 * an entry. Only the denominator is asserted: the copy around it is i18n
 * and theme-cased, and matching that would pin the translation.
 *
 * The empty node is asserted CLICKABLE, not just present: it is the only
 * route out of the PAGE, and on an empty-by-default deck it is the first
 * thing a new install shows, so a decorative empty state would leave the
 * home screen with nothing to act on.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { waitForPersisted, waitForPersistedWithout } from '../helpers';

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
  await expect(configRow(page, MARKET)).toBeVisible({ timeout: 30_000 });
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
    await expect(configRow(page, MARKET)).toBeVisible();
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
    await expect(statusStrip(page)).toContainText('/15');

    await openDeckConfig(page);
    await switchOn(page, MARKET, '"shopping"');

    await openDeck(page);
    await expect(statusStrip(page)).toContainText('/15');
  });

  test('names the module a program belongs to on its own row', async ({
    page,
  }) => {
    await openDeckConfig(page);
    await expect(configRow(page, MARKET)).toContainText(HOUSEHOLD_MODULE);
  });
});
