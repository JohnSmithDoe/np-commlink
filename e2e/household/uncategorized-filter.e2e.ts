/* ─── why ─────────────────────────────────────────────────────────
 * One flow, because the two things worth proving share a setup and the
 * second only exists inside the first.
 *
 * The seeding assertion is the point: creating an item while a filter is
 * armed seeds that filter as the item's category, so an unguarded
 * `__uncategorized__` would be written onto the new item — and the symptom
 * is visible rather than merely wrong in storage. The item would fail its
 * own active filter and DISAPPEAR from the list under the tap that created
 * it. Asserting it stays visible is therefore the whole guard, with no
 * need to reach into the persisted blob.
 *
 * Categories are assigned the same way rather than through the edit
 * dialog's picker: arming a category chip and adding through the searchbar
 * is the very mechanism under test, so it costs no extra steps and keeps
 * the spec on the one code path that matters.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import {
  addViaSearch,
  listRow,
  pageRoot,
  presentedDialog,
  ROUTE,
  gotoFeature,
  waitForListPage,
} from '../helpers';

const chip = (page: Page, name: string) =>
  page.locator('app-category-filter-bar ion-button').filter({ hasText: name });

async function addCategory(page: Page, name: string) {
  await page
    .getByRole('button', { name: 'Kategorien verwalten' })
    .first()
    .click();
  await expect(page).toHaveURL(/household\/categories/);

  const catalog = pageRoot(page, 'app-page-category-list');
  await expect(catalog).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('page-header-add').last().click();

  const dialog = presentedDialog(page, 'Neuen Eintrag anlegen');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByPlaceholder('Gib einen Namen ein').fill(name);
  await dialog.getByRole('button', { name: 'Anlegen' }).click();

  await expect(
    catalog.getByTestId('list-row').filter({ hasText: name })
  ).toBeVisible({
    timeout: 10_000,
  });
  await gotoFeature(page, ROUTE.storage);
  await waitForListPage(page);
}

test.describe('uncategorized filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/household/storage');
    await waitForListPage(page);
    await addCategory(page, 'Getränke');
  });

  test('shows only items without a category, and keeps new ones there', async ({
    page,
  }) => {
    await chip(page, 'Getränke').click();
    await addViaSearch(page, 'Wasser');
    await expect(listRow(page, /Wasser/)).toBeVisible({ timeout: 10_000 });

    await chip(page, 'Getränke').click();
    await addViaSearch(page, 'Brot');
    await expect(listRow(page, /Brot/)).toBeVisible({ timeout: 10_000 });

    await chip(page, 'Ohne Kategorie').click();

    await expect(listRow(page, /Brot/)).toBeVisible();
    await expect(listRow(page, /Wasser/)).toHaveCount(0);

    await addViaSearch(page, 'Salz');

    await expect(listRow(page, /Salz/)).toBeVisible({ timeout: 10_000 });
  });

  test('offers no uncategorized chip once every item carries a category', async ({
    page,
  }) => {
    await chip(page, 'Getränke').click();
    await addViaSearch(page, 'Wasser');
    await expect(listRow(page, /Wasser/)).toBeVisible({ timeout: 10_000 });

    await chip(page, 'Getränke').click();
    await expect(listRow(page, /Wasser/)).toBeVisible();

    await expect(chip(page, 'Ohne Kategorie')).toHaveCount(0);
  });
});
