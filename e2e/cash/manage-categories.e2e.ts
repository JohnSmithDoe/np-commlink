import { expect, Page, test } from '@playwright/test';
import {
  addViaSearch,
  listRow,
  pageRoot,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

/**
 * Cash adoption of the shared CATALOG LIST page + the cash category→items drill
 * (a category's transactions — cash's equivalent of the grocery/tasks `?filter`
 * list, since cash has no filterBy).
 */
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
    // Toolbar shortcut → the shared catalog list page (cash CATEGORY_LIST_FACADE).
    await page.getByRole('button', { name: 'Kategorien' }).first().click();
    await expect(page).toHaveURL(/cash\/categories/);

    // The catalog is a list, so the shared add-via-searchbar helper works on it.
    await waitForListPage(page);
    await addViaSearch(page, 'Miete');

    await expect(listRow(page, 'Miete')).toBeVisible({ timeout: 10_000 });
    // No transactions yet → count 0.
    await expect(listRow(page, 'Miete')).toContainText('0');

    // Back → the cash overview (listHref).
    await page.getByRole('link', { name: 'Zurück' }).first().click();
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
    // The "create" row appearing is the searchbar debounce having landed.
    const createMiete = page.getByText('Miete erstellen');
    await expect(createMiete).toBeVisible({ timeout: 10_000 });
    await createMiete.click();
    await txnModal.getByRole('button', { name: 'Speichern' }).click();
    await expect(account.getByText('Wohnung Miete')).toBeVisible({
      timeout: 10_000,
    });
    await waitForPersisted(page, 'cash', 'Wohnung Miete');

    // Manage page shows the category with count 1; tapping drills to its txns.
    // Scope to the manage-page component — the (hidden) account page still has a
    // "Wohnung Miete" txn row that would otherwise also match.
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
