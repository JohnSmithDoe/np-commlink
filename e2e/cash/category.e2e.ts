/* ─── why ─────────────────────────────────────────────────────────
 * The shared category picker in SINGLE-select mode, which is what a cash
 * transaction takes: tapping the "create" row selects, confirms and
 * closes in one step, where the multi mode the household specs drive needs
 * a separate "Auswählen".
 *
 * The picker's searchbar is located unscoped because a cash page has no
 * searchbar of its own, so the picker's — teleported to the app root — is
 * the only one in the document.
 *
 * The create row appearing IS the searchbar debounce having landed, so
 * waiting for it replaces a fixed timeout.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { listRow, pageRoot, presentedDialog } from '../helpers';

test.describe('cash transaction category', () => {
  test('assigns a category to a transaction via the single-select picker', async ({
    page,
  }) => {
    await page.goto('/#/cash');
    const list = pageRoot(page, 'app-page-cash');
    await expect(list).toBeVisible({ timeout: 30_000 });

    await list.getByTestId('page-header-add').click();
    const accountModal = presentedDialog(page, 'Neuen Eintrag anlegen');
    await accountModal
      .getByRole('textbox', { name: 'Name' })
      .fill('CREDSTICK-01');
    await accountModal.getByRole('button', { name: 'Anlegen' }).click();
    await expect(list.getByText('CREDSTICK-01')).toBeVisible({
      timeout: 10_000,
    });

    await list.getByText('CREDSTICK-01').click();
    const account = pageRoot(page, 'app-page-cash-account');
    await expect(account).toBeVisible({ timeout: 10_000 });
    await account.getByTestId('page-header-add').click();

    const txnModal = presentedDialog(page, 'Neuen Eintrag anlegen');
    await txnModal.getByRole('textbox', { name: 'Name' }).fill('Soykaf refill');
    await txnModal.getByRole('textbox', { name: 'Betrag' }).fill('12,34');

    await txnModal.getByTestId('category-input-trigger').click();
    const pickerSearch = page
      .getByTestId('category-picker-search')
      .locator('input');
    await expect(pickerSearch).toBeVisible({ timeout: 10_000 });
    await pickerSearch.fill('Kaffee');
    const createKaffee = page.getByText('Kaffee erstellen');
    await expect(createKaffee).toBeVisible({ timeout: 10_000 });
    await createKaffee.click();

    await expect(
      txnModal.locator('app-category-input').getByText('Kaffee')
    ).toBeVisible({ timeout: 10_000 });
    await txnModal.getByRole('button', { name: 'Anlegen' }).click();

    const row = listRow(page, 'Soykaf refill');
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.getByTestId('list-row-category')).toHaveText('Kaffee');
  });
});
