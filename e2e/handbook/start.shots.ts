import { expect, Page, test } from '@playwright/test';
import {
  addViaSearch,
  gotoFeature,
  ROUTE,
  waitForListPage,
  waitForPersisted,
} from '../helpers';
import { bootDeck, openPage, shot, shotOf } from './shot';

const configRow = (page: Page, codename: string) =>
  page
    .locator('app-page-deck-config')
    .getByTestId('deck-config-row')
    .filter({ hasText: codename });

async function switchOn(page: Page, codename: string, id: string) {
  await configRow(page, codename).getByTestId('deck-config-row-toggle').click();
  await waitForPersisted(page, 'deck', `"${id}"`);
}

async function seed(page: Page) {
  await page.goto('/#/tracking');
  await waitForListPage(page);
  await addViaSearch(page, 'Standup');
  await addViaSearch(page, 'Kundenprojekt');
  await waitForPersisted(page, 'summary-tracking');

  await gotoFeature(page, ROUTE.shopping);
  await addViaSearch(page, 'Milch');
  await addViaSearch(page, 'Brot');
  await waitForPersisted(page, 'summary-shopping');

  await gotoFeature(page, ROUTE.tasks);
  await addViaSearch(page, 'Zahnarzttermin');
  await waitForPersisted(page, 'summary-tasks');
}

test('cold deck ships empty', async ({ page }) => {
  const root = await openPage(page, 'commlink', 'app-page-commlink');
  await expect(root.getByTestId('deck-empty')).toBeVisible();
  await shot(page, 'start-leeres-deck');
});

test('deck config with toggles and handles', async ({ page }) => {
  await page.goto('/#/commlink/deck');
  await expect(configRow(page, 'CHRONO')).toBeVisible({ timeout: 60_000 });
  await switchOn(page, 'CHRONO', 'tracking');
  await switchOn(page, 'MEATSPACE', 'office-time');
  await switchOn(page, 'COMMS', 'notifications');
  await switchOn(page, 'MARKET', 'shopping');
  await shot(page, 'start-deck-konfiguration');
});

test('populated deck and one tile up close', async ({ page }) => {
  await seed(page);
  await bootDeck(page);
  const root = await openPage(page, 'commlink', 'app-page-commlink');
  await expect(root.getByTestId('deck-tile-badge').first()).toBeVisible();
  await shot(page, 'start-deck');

  const tile = root.getByTestId('deck-tile').filter({ hasText: 'MARKET' });
  await tile.scrollIntoViewIfNeeded();
  await shotOf(tile, 'start-kachel');
  await shotOf(root.locator('.cl-hero'), 'start-statuszeile');
});

test('side menu mirrors the deck', async ({ page }) => {
  await seed(page);
  await bootDeck(page);
  const root = await openPage(page, 'commlink', 'app-page-commlink');
  await root.locator('ion-menu-button').click();
  await expect(
    page.locator('ion-menu').getByTestId('menu-row').first()
  ).toBeVisible();
  await shot(page, 'start-menu');
});
