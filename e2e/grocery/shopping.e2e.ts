import { expect, test } from '@playwright/test';
import { addViaSearch, waitForListPage } from '../helpers';

test.describe('shopping list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/shopping/_shopping');
    await waitForListPage(page);
  });

  test('adds a shopping item through the searchbar', async ({ page }) => {
    await addViaSearch(page, 'Coffee');
    await expect(page.getByText(/Coffee/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  // Drives the refactored shopping edit dialog (pure-ui modal + local draft).
  test('edits a shopping item through the edit dialog', async ({ page }) => {
    await addViaSearch(page, 'Coffee');
    await expect(page.getByText(/Coffee/).first()).toBeVisible({
      timeout: 10_000,
    });
    await page
      .getByText(/Coffee/)
      .first()
      .click();

    const nameField = page.getByRole('textbox', { name: 'Name' });
    await expect(nameField).toBeVisible({ timeout: 10_000 });
    await nameField.fill('Espresso');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(page.getByText(/Espresso/).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
