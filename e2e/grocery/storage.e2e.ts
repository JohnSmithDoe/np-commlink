import { expect, test } from '@playwright/test';
import { addViaSearch, searchInput, waitForListPage } from '../helpers';

test.describe('storage list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/storage/_storage');
    await waitForListPage(page);
  });

  test('adds an item through the searchbar', async ({ page }) => {
    await addViaSearch(page, 'Bananas');
    await expect(page.getByText(/Bananas/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('keeps items across a navigation round-trip', async ({ page }) => {
    await addViaSearch(page, 'Yoghurt');
    await expect(page.getByText(/Yoghurt/).first()).toBeVisible({
      timeout: 10_000,
    });

    await page.goto('/#/shopping/_shopping');
    await waitForListPage(page);
    await page.goto('/#/storage/_storage');
    await waitForListPage(page);

    await expect(page.getByText(/Yoghurt/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('filters the list by the search query', async ({ page }) => {
    await addViaSearch(page, 'Apples');
    await addViaSearch(page, 'Cucumber');

    const input = searchInput(page);
    await input.fill('Apple');
    await page.waitForTimeout(400);

    await expect(page.getByText(/Apples/).first()).toBeVisible();
    await expect(page.getByText(/Cucumber/)).toHaveCount(0);
  });

  // Exercises the refactored edit dialog end-to-end: open via row click (the
  // pure-ui item-edit-modal driven by a local draft), rename, save, verify the
  // update persisted to the list.
  test('edits an item through the edit dialog', async ({ page }) => {
    await addViaSearch(page, 'Milk');

    // Open the edit dialog via the row. Ionic teleports the presented modal to
    // the app root, so drive it via the dialog role, not the wrapper element.
    await expect(page.getByText('1 x Milk')).toBeVisible({ timeout: 10_000 });
    await page.getByText('1 x Milk').click();

    const nameField = page.getByRole('textbox', { name: 'Name' });
    await expect(nameField).toBeVisible({ timeout: 10_000 });
    await nameField.fill('Almond Milk');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(page.getByText('1 x Almond Milk')).toBeVisible({
      timeout: 10_000,
    });
  });
});
