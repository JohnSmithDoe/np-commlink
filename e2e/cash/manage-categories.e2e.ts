/* ─── why ─────────────────────────────────────────────────────────
 * Cash on the shared catalog-list page. The catalog IS a list, which is
 * the whole claim: the suite's add-via-searchbar helper drives it
 * unchanged, where the page it replaced carried a bespoke input row.
 *
 * The drill from a category into its items is a ROUTE here
 * (`/cash/category/:id`) rather than the `?filter=` query the household and
 * task lists use, because cash's own list has no `filterBy`.
 *
 * A category row's note is its transaction count, so the `0` and the `1`
 * are what assert the join is live rather than the label static.
 *
 * The picker's create row appearing IS the searchbar debounce having
 * landed, so waiting for it replaces a fixed timeout.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import {
  addViaSearch,
  listRow,
  pageRoot,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

async function openOverview(page: Page) {
  await page.goto('/#/cash');
  await expect(pageRoot(page, 'app-page-cash')).toBeVisible({
    timeout: 30_000,
  });
}

test.describe('cash manage categories', () => {
  test('adds a category from the catalog page and returns via back', async ({
    page,
  }) => {
    await openOverview(page);
    await page.getByRole('button', { name: 'Kategorien' }).first().click();
    await expect(page).toHaveURL(/cash\/categories/);

    await waitForListPage(page);
    await addViaSearch(page, 'Miete');

    await expect(listRow(page, 'Miete')).toBeVisible({ timeout: 10_000 });
    await expect(listRow(page, 'Miete')).toContainText('0');

    await page.getByRole('button', { name: 'Zurück' }).first().click();
    await expect(page).toHaveURL(/#\/cash$/);
  });

  test('drills from a category into its transactions', async ({ page }) => {
    await openOverview(page);
    const list = pageRoot(page, 'app-page-cash');

    await list.getByTestId('page-header-add').click();
    const accountModal = page.locator('app-cash-account-edit-modal');
    await accountModal
      .getByRole('textbox', { name: 'Name' })
      .fill('CREDSTICK-07');
    await accountModal.getByRole('button', { name: 'Speichern' }).click();
    await expect(list.getByText('CREDSTICK-07')).toBeVisible({
      timeout: 10_000,
    });

    await list.getByText('CREDSTICK-07').click();
    const account = pageRoot(page, 'app-page-cash-account');
    await expect(account).toBeVisible({ timeout: 10_000 });
    await account
      .getByRole('button', { name: 'Transaktion hinzufügen' })
      .click();
    const txnModal = page.locator('app-cash-transaction-edit-modal');
    await txnModal
      .getByRole('textbox', { name: 'Beschreibung' })
      .fill('Wohnung Miete');
    await txnModal.getByRole('textbox', { name: 'Betrag' }).fill('750,00');
    await txnModal.getByTestId('category-input-trigger').click();
    const pickerSearch = page
      .getByTestId('category-picker-search')
      .locator('input');
    await expect(pickerSearch).toBeVisible({ timeout: 10_000 });
    await pickerSearch.fill('Miete');
    const createMiete = page.getByText('Miete erstellen');
    await expect(createMiete).toBeVisible({ timeout: 10_000 });
    await createMiete.click();
    await txnModal.getByRole('button', { name: 'Speichern' }).click();
    await expect(account.getByText('Wohnung Miete')).toBeVisible({
      timeout: 10_000,
    });
    await waitForPersisted(page, 'cash', 'Wohnung Miete');

    await page.goto('/#/cash/categories');
    await expect(listRow(page, 'Miete')).toContainText('1', {
      timeout: 10_000,
    });
    await listRow(page, 'Miete').click();

    await expect(page).toHaveURL(/cash\/category\//);
    await expect(
      page.locator('#main-content').getByText('Wohnung Miete')
    ).toBeVisible({ timeout: 10_000 });
  });
});
