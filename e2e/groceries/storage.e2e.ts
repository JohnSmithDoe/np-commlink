import { expect, test } from '@playwright/test';
import { addViaSearch, searchInput, waitForListPage } from '../helpers';

test.describe('storage list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/groceries/storage/_storage');
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

    await page.goto('/#/groceries/shopping/_shopping');
    await waitForListPage(page);
    await page.goto('/#/groceries/storage/_storage');
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

    // Both assertions retry, so they outlast the searchbar debounce on their own.
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

  // Drives the shared category picker (the Stage-1 custom selectable list): open
  // it from the edit dialog, create a new category, confirm (multi mode), save,
  // then re-open the item to prove the category folded into the draft + persisted.
  test('assigns a category via the picker', async ({ page }) => {
    await addViaSearch(page, 'Cheese');
    await expect(page.getByText('1 x Cheese')).toBeVisible({ timeout: 10_000 });
    await page.getByText('1 x Cheese').click();

    // open the picker from the category-input row
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('app-category-input ion-item').first().click();

    // The picker's <ion-modal> teleports to the app root, so its Confirm button
    // ("Auswählen") signals it opened; its searchbar is then the last one on the
    // page (the list-page searchbar is behind it, same placeholder).
    await expect(page.getByRole('button', { name: 'Auswählen' })).toBeVisible({
      timeout: 10_000,
    });
    const pickerSearch = page.locator('ion-searchbar input').last();
    await pickerSearch.fill('Fridge');

    // tap the "create" row (its appearance is the debounce having landed), then
    // confirm the now-selected category (multi mode)
    const createFridge = page.getByText('Fridge erstellen');
    await expect(createFridge).toBeVisible({ timeout: 10_000 });
    await createFridge.click();
    await page.getByRole('button', { name: 'Auswählen' }).click();

    await expect(
      page.locator('app-category-input').getByText('Fridge')
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    // re-open the item → the category persisted onto it
    await expect(page.getByText('1 x Cheese')).toBeVisible({ timeout: 10_000 });
    await page.getByText('1 x Cheese').click();
    await expect(
      page.locator('app-category-input').getByText('Fridge')
    ).toBeVisible({ timeout: 10_000 });
  });

  // The category-NAME dialog: in categories display mode the "+" names a new
  // category instead of opening the item dialog. That branch used to live in two
  // guarded NgRx effects with the working name written to the store per keystroke;
  // it is now the shared list page's own signal + IListPageFacade.saveCategory.
  test('names a new category from the "+" in categories display mode', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Kategorien', exact: true }).click();
    await page.getByRole('button', { name: 'Hinzufügen' }).click();

    // The dialog's <ion-modal> teleports to the app root, so key off its title.
    await expect(page.getByText('Neue Kategorie anlegen')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByPlaceholder('Gib einen Namen ein').fill('Frozen');
    await page.getByRole('button', { name: 'Anlegen' }).click();

    await expect(page.locator('#main-content').getByText('Frozen')).toBeVisible(
      { timeout: 10_000 }
    );
  });

  // A cancelled name must not leak into the next open (the draft resets on open).
  test('discards a cancelled category name', async ({ page }) => {
    await page.getByRole('button', { name: 'Kategorien', exact: true }).click();
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(page.getByText('Neue Kategorie anlegen')).toBeVisible({
      timeout: 10_000,
    });

    await page.getByPlaceholder('Gib einen Namen ein').fill('Typo');
    await page.getByRole('button', { name: 'Abbrechen' }).click();

    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await expect(page.getByText('Neue Kategorie anlegen')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByPlaceholder('Gib einen Namen ein')).toHaveValue('');
    await expect(page.locator('#main-content').getByText('Typo')).toHaveCount(
      0
    );
  });
});
