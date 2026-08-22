/* ─── why ─────────────────────────────────────────────────────────
 * The cross-cutting page documents the SHARED list surface, so every shot
 * is taken on one seeded shopping list rather than one per module: the row,
 * the two swipes, the search box, the item dialog and the category picker
 * are the same components everywhere they appear.
 *
 * One test, not six: each shot depends on the state the previous one left
 * (the category picker needs a dialog open, the filter bar needs a category
 * assigned), and a fresh context per test would re-seed all of it.
 * ───────────────────────────────────────────────────────────────── */
import { expect, Locator, Page, test } from '@playwright/test';
import {
  addViaSearch,
  editDialog,
  listRow,
  openRowSwipe,
  pageRoot,
  searchInput,
  waitForListPage,
} from '../helpers';
import { bootDeck, shot } from './shot';

const ITEMS = ['Milch', 'Vollkornbrot', 'Kaffeebohnen', 'Zahnpasta'];

const closeSwipe = (row: Locator) =>
  row.evaluate((element: HTMLElement & { close(): Promise<void> }) =>
    element.close()
  );

const pickerDialog = (page: Page) =>
  page
    .locator('ion-modal.show-modal')
    .filter({ has: page.getByTestId('category-picker-search') });

async function addCategory(page: Page, name: string): Promise<void> {
  const search = pickerDialog(page).locator('ion-searchbar input');
  await search.fill(name);
  await page.waitForTimeout(400); // > the searchbar's 250ms debounce
  await search.press('Enter');
  await page.waitForTimeout(300);
}

test('shared interaction surface', async ({ page }) => {
  await bootDeck(page);
  await page.goto('/#/household/shopping');
  await waitForListPage(page);

  for (const item of ITEMS) await addViaSearch(page, item);
  await expect(listRow(page, /Zahnpasta/)).toBeVisible({ timeout: 15_000 });
  await shot(page, 'gesten-liste');

  const deleteRow = listRow(page, /Zahnpasta/);
  await openRowSwipe(deleteRow, 'end');
  await expect(deleteRow.getByTestId('list-row-delete')).toBeVisible();
  await shot(page, 'gesten-swipe-loeschen');
  await closeSwipe(deleteRow);

  const buyRow = listRow(page, /Vollkornbrot/);
  await openRowSwipe(buyRow, 'start');
  await expect(
    buyRow.locator('ion-item-options[side="start"] ion-item-option')
  ).toBeVisible();
  await shot(page, 'gesten-swipe-start');
  await closeSwipe(buyRow);

  const search = searchInput(page);
  await search.click();
  await search.fill('Joghurt');
  await page.waitForTimeout(600); // > debounce, so the empty state has rendered
  await shot(page, 'gesten-suche-anlegen');
  await search.fill('');
  await page.waitForTimeout(600);

  await listRow(page, /Milch/).click();
  const dialog = editDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await shot(page, 'gesten-dialog-bearbeiten');

  await dialog.getByTestId('category-input-trigger').click();
  await expect(pickerDialog(page)).toBeVisible({ timeout: 15_000 });
  await addCategory(page, 'Getränke');
  await addCategory(page, 'Frühstück');
  await shot(page, 'gesten-kategorien-dialog');

  await pickerDialog(page).getByRole('button', { name: 'Auswählen' }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });

  const filterBar = pageRoot(page, 'app-page-shopping').locator(
    'app-category-filter-bar'
  );
  await expect(filterBar).toBeVisible({ timeout: 15_000 });
  await filterBar.getByRole('button', { name: 'Getränke' }).click();
  await expect(listRow(page, /Milch/)).toBeVisible();
  await shot(page, 'gesten-kategoriefilter');

  await filterBar.getByTestId('clear-category-filter').click();
  await expect(listRow(page, /Zahnpasta/)).toBeVisible();

  const boughtRow = listRow(page, /Kaffeebohnen/);
  await openRowSwipe(boughtRow, 'start');
  await boughtRow
    .locator('ion-item-options[side="start"] ion-item-option')
    .click();
  await page.waitForTimeout(500);

  await page
    .locator('app-page-shopping')
    .getByRole('button', { name: 'Aktionen' })
    .click();
  const sheet = page.locator('ion-action-sheet');
  await expect(sheet).toBeVisible({ timeout: 15_000 });
  await shot(page, 'gesten-aktionsmenue');
});
