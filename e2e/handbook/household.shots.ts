/* ─── why ─────────────────────────────────────────────────────────
 * One script for all three household lists, because they are one machine:
 * the same `app-list-page`, the same row, the same category catalog. Three
 * tests rather than one, because each list needs its own seed and Playwright
 * gives every test a fresh IndexedDB.
 *
 * Categories are seeded by ARMING a chip and adding through the searchbar —
 * `createBaseItem` reads the active filter — which is far cheaper than
 * driving the picker dialog once per item.
 *
 * The pantry's best-before note comes from a PRODUCT with a shelf life,
 * because that is the only path that writes `bestBefore` without driving an
 * `ion-datetime` sheet.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  addViaSearch,
  editDialog,
  openRowSwipe,
  searchInput,
  waitForListPage,
} from '../helpers';
import { bootDeck, openPage, shot, shotOf } from './shot';

const DEBOUNCE_MS = 400;

const live = (page: Page, selector: string) =>
  page.locator('#main-content').locator(selector).last();

const rowIn = (root: Locator, name: string | RegExp) =>
  root.getByTestId('list-row').filter({ hasText: name });

const startOption = (row: Locator) =>
  row.locator('ion-item-options[side="start"] ion-item-option');

const closeSwipe = (row: Locator) =>
  row.evaluate((element: HTMLElement & { close(): Promise<void> }) =>
    element.close()
  );

async function addCategories(
  page: Page,
  root: Locator,
  back: string,
  names: string[]
): Promise<void> {
  await root.getByRole('button', { name: 'Kategorien verwalten' }).click();
  await expect(page).toHaveURL(/household\/categories/);
  const catalog = live(page, 'app-page-category-list');
  await expect(catalog).toBeVisible({ timeout: 30_000 });

  const input = catalog.locator('ion-searchbar input');
  for (const name of names) {
    await input.click();
    await input.fill(name);
    await page.waitForTimeout(DEBOUNCE_MS);
    await input.press('Enter');
    await input.fill('');
    await page.waitForTimeout(DEBOUNCE_MS);
    await expect(
      catalog.getByTestId('list-row').filter({ hasText: name })
    ).toBeVisible({ timeout: 15_000 });
  }

  await page.goto(`/#/${back}`);
  await waitForListPage(page);
}

async function seedUnder(
  page: Page,
  root: Locator,
  category: string,
  items: string[]
): Promise<void> {
  const chip = root
    .locator('app-category-filter-bar ion-button')
    .filter({ hasText: category });
  await expect(chip).toBeVisible({ timeout: 15_000 });
  await chip.click();
  await page.waitForTimeout(DEBOUNCE_MS);

  for (const item of items) await addViaSearch(page, item, root);

  await root.getByTestId('clear-category-filter').click();
  await page.waitForTimeout(DEBOUNCE_MS);
}

async function enableFlag(page: Page, flag: string): Promise<void> {
  await page.goto('/#/household/list-settings');
  const toggle = page.getByTestId(`list-settings-flag-${flag}`);
  await expect(toggle).toBeVisible({ timeout: 30_000 });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
}

test('market — the shopping list', async ({ page }) => {
  await bootDeck(page);
  await openPage(page, 'household/shopping', 'app-page-shopping');
  await waitForListPage(page);
  const root = live(page, 'app-page-shopping');

  await addCategories(page, root, 'household/shopping', [
    'Kühlregal',
    'Trockenwaren',
  ]);
  await seedUnder(page, root, 'Kühlregal', ['Milch', 'Joghurt', 'Butter']);
  await seedUnder(page, root, 'Trockenwaren', [
    'Vollkornbrot',
    'Kaffeebohnen',
    'Nudeln',
  ]);
  for (const item of ['Bananen', 'Spülmittel'])
    await addViaSearch(page, item, root);

  const butter = rowIn(root, /Butter/);
  await openRowSwipe(butter, 'start');
  await expect(startOption(butter)).toBeVisible({ timeout: 15_000 });
  await shot(page, 'market-swipe-kaufen');
  await startOption(butter).click();

  const nudeln = rowIn(root, /Nudeln/);
  await openRowSwipe(nudeln, 'start');
  await expect(startOption(nudeln)).toBeVisible({ timeout: 15_000 });
  await startOption(nudeln).click();
  await page.waitForTimeout(DEBOUNCE_MS);
  await shot(page, 'market-liste');

  const spuelmittel = rowIn(root, /Spülmittel/);
  await openRowSwipe(spuelmittel, 'end');
  await expect(spuelmittel.getByTestId('list-row-delete')).toBeVisible({
    timeout: 15_000,
  });
  await shot(page, 'market-swipe-loeschen');
  await closeSwipe(spuelmittel);

  await root.getByRole('button', { name: 'Aktionen' }).click();
  const sheet = page.locator('ion-action-sheet').last();
  await expect(sheet).toBeVisible({ timeout: 15_000 });
  await shot(page, 'market-aktionen');
  await sheet.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(sheet).toBeHidden({ timeout: 15_000 });

  await shotOf(page.locator('ion-tab-bar').last(), 'market-tableiste');
});

test('stash — the pantry', async ({ page }) => {
  await bootDeck(page);
  await openPage(page, 'household/products', 'app-page-products');
  await waitForListPage(page);
  const products = live(page, 'app-page-products');

  await addViaSearch(page, 'Joghurt', products);
  await rowIn(products, /Joghurt/).click();
  const productDialog = editDialog(page);
  await expect(productDialog).toBeVisible({ timeout: 15_000 });
  await productDialog.locator('ion-select').click();
  const popover = page.locator('ion-popover');
  await expect(popover).toBeVisible({ timeout: 15_000 });
  await popover.getByRole('radio', { name: 'Wochen' }).click();
  await expect(popover).toBeHidden({ timeout: 15_000 });
  await productDialog.locator('app-number-input input').fill('3');
  await productDialog.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(productDialog).toBeHidden({ timeout: 15_000 });

  await enableFlag(page, 'show-products-in-storage');

  await openPage(page, 'household/storage', 'app-page-storage');
  await waitForListPage(page);
  const root = live(page, 'app-page-storage');

  await addCategories(page, root, 'household/storage', [
    'Kühlregal',
    'Vorratsschrank',
  ]);
  await seedUnder(page, root, 'Kühlregal', ['Milch', 'Butter', 'Eier']);
  await seedUnder(page, root, 'Vorratsschrank', ['Reis', 'Olivenöl', 'Mehl']);

  const search = searchInput(page, root);
  await search.click();
  await search.fill('Joghurt');
  await page.waitForTimeout(600);
  const suggestion = root
    .locator('app-household-search-panel app-text-item')
    .first();
  await expect(suggestion).toContainText('Aus den Produkten', {
    timeout: 15_000,
  });
  await shot(page, 'stash-produkt-uebernehmen');
  await suggestion.click();
  await search.fill('');
  await page.waitForTimeout(600);

  await rowIn(root, /Reis/).click();
  const itemDialog = editDialog(page);
  await expect(itemDialog).toBeVisible({ timeout: 15_000 });
  await itemDialog.locator('app-number-input input').fill('3');
  await shot(page, 'stash-dialog');
  await itemDialog.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(itemDialog).toBeHidden({ timeout: 15_000 });
  await shot(page, 'stash-liste');

  const milch = rowIn(root, /Milch/);
  await openRowSwipe(milch, 'start');
  await expect(startOption(milch)).toBeVisible({ timeout: 15_000 });
  await shot(page, 'stash-swipe-einkauf');
  await closeSwipe(milch);

  const mehl = rowIn(root, /Mehl/);
  await openRowSwipe(mehl, 'end');
  await expect(mehl.getByTestId('list-row-delete')).toBeVisible({
    timeout: 15_000,
  });
  await shot(page, 'stash-swipe-loeschen');
  await closeSwipe(mehl);
});

test('catalog — the master products', async ({ page }) => {
  await bootDeck(page);
  await openPage(page, 'household/products', 'app-page-products');
  await waitForListPage(page);
  const root = live(page, 'app-page-products');

  await addCategories(page, root, 'household/products', [
    'Kühlregal',
    'Vorratsschrank',
  ]);
  await seedUnder(page, root, 'Kühlregal', ['Milch', 'Joghurt', 'Butter']);
  await seedUnder(page, root, 'Vorratsschrank', ['Reis', 'Nudeln', 'Olivenöl']);
  await addViaSearch(page, 'Zahnpasta', root);

  await shot(page, 'catalog-liste');

  await rowIn(root, /Joghurt/).click();
  const dialog = editDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await shot(page, 'catalog-dialog');
  await dialog.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });

  const zahnpasta = rowIn(root, /Zahnpasta/);
  await openRowSwipe(zahnpasta, 'end');
  await expect(zahnpasta.getByTestId('list-row-delete')).toBeVisible({
    timeout: 15_000,
  });
  await shot(page, 'catalog-swipe-loeschen');
  await closeSwipe(zahnpasta);

  await page.goto('/#/household/list-settings');
  await expect(
    page.getByTestId('list-settings-flag-show-quick-add')
  ).toBeVisible({ timeout: 30_000 });
  await shot(page, 'catalog-listenoptionen');
});
