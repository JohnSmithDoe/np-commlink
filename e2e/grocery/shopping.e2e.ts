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
});
