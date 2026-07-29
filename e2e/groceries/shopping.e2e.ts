import { expect, test } from '@playwright/test';
import { addViaSearch, listRow, waitForListPage } from '../helpers';

test.describe('shopping list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/groceries/shopping/_shopping');
    await waitForListPage(page);
  });

  test('adds a shopping item through the searchbar', async ({ page }) => {
    await addViaSearch(page, 'Coffee');
    await expect(listRow(page, /Coffee/)).toBeVisible({ timeout: 10_000 });
  });

  // Drives the refactored shopping edit dialog (pure-ui modal + local draft).
  test('edits a shopping item through the edit dialog', async ({ page }) => {
    await addViaSearch(page, 'Coffee');
    await expect(listRow(page, /Coffee/)).toBeVisible({ timeout: 10_000 });
    await listRow(page, /Coffee/).click();

    const nameField = page.getByRole('textbox', { name: 'Name' });
    await expect(nameField).toBeVisible({ timeout: 10_000 });
    await nameField.fill('Espresso');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(listRow(page, /Espresso/)).toBeVisible({ timeout: 10_000 });
  });
});
