import { expect, Page, test } from '@playwright/test';

/**
 * Cash adoption of the shared manage-categories page + the cash category→items
 * drill (a category's transactions — cash's equivalent of the grocery/tasks
 * `?filter` list, since cash has no filterBy).
 */
async function openOverview(page: Page) {
  await page.goto('/#/cash');
  await expect(page.locator('#main-content app-page-cash')).toBeVisible({
    timeout: 30_000,
  });
}

test.describe('cash manage categories', () => {
  test('adds a category from the manage page and returns via back', async ({
    page,
  }) => {
    await openOverview(page);
    // Toolbar shortcut → the shared manage page (cash CATEGORIES_FACADE).
    await page.getByRole('button', { name: 'Kategorien' }).first().click();
    await expect(page).toHaveURL(/cash\/categories/);

    const input = page.getByPlaceholder('Neue Kategorie');
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.click();
    await input.fill('Miete');
    await input.press('Enter');

    await expect(
      page.locator('app-edit-categories-page').getByText('Miete', {
        exact: true,
      })
    ).toBeVisible({ timeout: 10_000 });
    // No transactions yet → count 0.
    await expect(
      page.locator('app-edit-categories-page ion-item-sliding', {
        hasText: 'Miete',
      })
    ).toContainText('0');

    // Back → the cash overview (listHref).
    await page.getByRole('link', { name: 'Zurück' }).first().click();
    await expect(page).toHaveURL(/#\/cash$/);
  });

  test('drills from a category into its transactions', async ({ page }) => {
    await openOverview(page);
    const list = page.locator('#main-content app-page-cash');

    await list
      .locator('ion-button', { has: page.locator('ion-icon[name="add"]') })
      .click();
    const accountModal = page.locator('app-cash-account-edit-modal');
    await accountModal
      .getByRole('textbox', { name: 'Name' })
      .fill('CREDSTICK-07');
    await accountModal.getByRole('button', { name: 'Speichern' }).click();
    await expect(list.getByText('CREDSTICK-07')).toBeVisible({
      timeout: 10_000,
    });

    await list.getByText('CREDSTICK-07').click();
    const account = page.locator('#main-content app-page-cash-account');
    await expect(account).toBeVisible({ timeout: 10_000 });
    await account
      .getByRole('button', { name: 'Transaktion hinzufügen' })
      .click();
    const txnModal = page.locator('app-cash-transaction-edit-modal');
    await txnModal
      .getByRole('textbox', { name: 'Beschreibung' })
      .fill('Wohnung Miete');
    await txnModal.getByRole('textbox', { name: 'Betrag' }).fill('750,00');
    await txnModal.locator('app-category-input ion-item').first().click();
    const pickerSearch = page.locator('ion-searchbar input').last();
    await expect(pickerSearch).toBeVisible({ timeout: 10_000 });
    await pickerSearch.fill('Miete');
    await page.waitForTimeout(400); // > 250ms searchbar debounce
    await page.getByText('Miete erstellen').click();
    await txnModal.getByRole('button', { name: 'Speichern' }).click();
    await expect(account.getByText('Wohnung Miete')).toBeVisible({
      timeout: 10_000,
    });
    await page.waitForTimeout(400); // let the catalog + txn save flush

    // Manage page shows the category with count 1; tapping drills to its txns.
    // Scope to the manage-page component — the (hidden) account page still has a
    // "Wohnung Miete" txn row that would otherwise also match.
    await page.goto('/#/cash/categories');
    const row = page.locator('app-edit-categories-page ion-item-sliding', {
      hasText: 'Miete',
    });
    await expect(row).toContainText('1', { timeout: 10_000 });
    await page
      .locator('app-edit-categories-page')
      .getByText('Miete', { exact: true })
      .click();

    await expect(page).toHaveURL(/cash\/category\//);
    await expect(
      page.locator('#main-content').getByText('Wohnung Miete')
    ).toBeVisible({ timeout: 10_000 });
  });
});
