import { expect, test } from '@playwright/test';

/**
 * Drives the shared category picker in **single-select** mode (Stage 2): a cash
 * transaction has exactly one category. Create an account + transaction, assign
 * a category through the picker (tap the "create" row → single mode confirms and
 * closes at once), save, and assert the category lands on the transaction row.
 */
test.describe('cash transaction category', () => {
  test('assigns a category to a transaction via the single-select picker', async ({
    page,
  }) => {
    await page.goto('/#/cash');
    const list = page.locator('#main-content app-page-cash');
    await expect(list).toBeVisible({ timeout: 30_000 });

    await list
      .locator('ion-button', { has: page.locator('ion-icon[name="add"]') })
      .click();
    const accountModal = page.locator('app-cash-account-edit-modal');
    await accountModal
      .getByRole('textbox', { name: 'Name' })
      .fill('CREDSTICK-01');
    await accountModal.getByRole('button', { name: 'Speichern' }).click();
    await expect(list.getByText('CREDSTICK-01')).toBeVisible({
      timeout: 10_000,
    });

    await list.getByText('CREDSTICK-01').click();
    const account = page.locator('#main-content app-page-cash-account');
    await expect(account).toBeVisible({ timeout: 10_000 });
    await account
      .getByRole('button', { name: 'Transaktion hinzufügen' })
      .click();

    const txnModal = page.locator('app-cash-transaction-edit-modal');
    await txnModal
      .getByRole('textbox', { name: 'Beschreibung' })
      .fill('Soykaf refill');
    await txnModal.getByRole('textbox', { name: 'Betrag' }).fill('12,34');

    // assign a category via the picker — cash pages have no other searchbar, so
    // the picker's (teleported to the app root) is the only one on the page.
    await txnModal.locator('app-category-input ion-item').first().click();
    const pickerSearch = page.locator('ion-searchbar input').last();
    await expect(pickerSearch).toBeVisible({ timeout: 10_000 });
    await pickerSearch.fill('Kaffee');
    // single mode: tapping "create" selects + confirms + closes in one step.
    // Its appearance is the searchbar debounce having landed.
    const createKaffee = page.getByText('Kaffee erstellen');
    await expect(createKaffee).toBeVisible({ timeout: 10_000 });
    await createKaffee.click();

    await expect(
      txnModal.locator('app-category-input').getByText('Kaffee')
    ).toBeVisible({ timeout: 10_000 });
    await txnModal.getByRole('button', { name: 'Speichern' }).click();

    await expect(account.getByText('Soykaf refill')).toBeVisible({
      timeout: 10_000,
    });
    await expect(account.getByText('Kaffee')).toBeVisible({ timeout: 10_000 });
  });
});
