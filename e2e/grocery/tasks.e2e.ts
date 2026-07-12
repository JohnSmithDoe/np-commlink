import { expect, test } from '@playwright/test';
import { addViaSearch, waitForListPage } from '../helpers';

test.describe('tasks list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/tasks/_tasks');
    await waitForListPage(page);
  });

  test('adds a task through the searchbar', async ({ page }) => {
    await addViaSearch(page, 'Buy stamps');
    await expect(page.getByText(/Buy stamps/).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
