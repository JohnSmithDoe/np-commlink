import { expect, Locator, Page, test } from '@playwright/test';
import {
  addViaSearch,
  gotoFeature,
  listRow,
  ROUTE,
  searchInput,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

/**
 * The presented item-edit dialog. Two things make the obvious scopes wrong, both
 * verified from the DOM on this route: presenting **moves** the `ion-modal` to
 * `ion-app` while leaving an `overlay-hidden` twin inside the wrapper (so
 * `app-edit-storage-item-dialog` matches two), and this route mounts **five**
 * `ion-modal`s (the item dialog, its category picker, the date picker, …). Ionic
 * also puts **no `role="dialog"`** on `ion-modal`, so of CLAUDE.md's two keys —
 * title or role — only the title exists: `.show-modal` narrows to what is
 * presented, the title to which one.
 */
function editDialog(page: Page): Locator {
  return page
    .locator('ion-modal.show-modal')
    .filter({ hasText: 'Eintrag bearbeiten' });
}

function nameBox(page: Page): Locator {
  return editDialog(page).getByRole('textbox', { name: 'Name' });
}

function saveButton(page: Page): Locator {
  return editDialog(page).getByRole('button', { name: 'Übernehmen' });
}

test.describe('storage list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/groceries/storage/_storage');
    await waitForListPage(page);
  });

  test('adds an item through the searchbar', async ({ page }) => {
    await addViaSearch(page, 'Bananas');
    await expect(listRow(page, /Bananas/)).toBeVisible({ timeout: 10_000 });
  });

  test('keeps items across a navigation round-trip', async ({ page }) => {
    await addViaSearch(page, 'Yoghurt');
    await expect(listRow(page, /Yoghurt/)).toBeVisible({ timeout: 10_000 });
    await waitForPersisted(page, 'groceries', 'Yoghurt');

    await gotoFeature(page, ROUTE.shopping);
    // Re-entering a route mounts the page a SECOND time and the first instance
    // outlives the navigation, so both carry `list-row` and the row locator is a
    // strict-mode violation — an id cannot disambiguate two copies of one
    // template. The reload collapses the outlet to one instance, and makes this a
    // cold read of the persisted list besides. It has to follow `gotoFeature`,
    // which awaits the URL: a hash navigation is same-document, so reloading
    // straight after `goto` can reload the route we just left.
    await gotoFeature(page, ROUTE.storage);
    await page.reload();
    await waitForListPage(page);

    await expect(listRow(page, /Yoghurt/)).toBeVisible({ timeout: 10_000 });
  });

  test('filters the list by the search query', async ({ page }) => {
    await addViaSearch(page, 'Apples');
    await addViaSearch(page, 'Cucumber');

    const input = searchInput(page);
    await input.fill('Apple');

    // Both assertions retry, so they outlast the searchbar debounce on their own.
    await expect(listRow(page, /Apples/)).toBeVisible();
    await expect(listRow(page, /Cucumber/)).toHaveCount(0);
  });

  // Exercises the refactored edit dialog end-to-end: open via row click (the
  // pure-ui item-edit-modal driven by a local draft), rename, save, verify the
  // update persisted to the list.
  test('edits an item through the edit dialog', async ({ page }) => {
    await addViaSearch(page, 'Milk');

    await expect(page.getByText('1 x Milk')).toBeVisible({ timeout: 10_000 });
    await page.getByText('1 x Milk').click();

    await expect(nameBox(page)).toBeVisible({ timeout: 10_000 });
    await nameBox(page).fill('Almond Milk');
    await saveButton(page).click();

    await expect(page.getByText('1 x Almond Milk')).toBeVisible({
      timeout: 10_000,
    });
  });

  // The name rule lives in the dialog's Signal Forms schema now, and the save
  // button reads `canSave` off that tree — it used to read validity off the name
  // input through a template ref. Only a real browser shows the button state, so
  // this is where that move is actually proven — and the message alongside it,
  // which a disabled-button assertion alone let regress once already: Ionic's own
  // `errorText` slot needs `ion-invalid ion-touched`, classes only an `NgControl`
  // on the `ion-input` produces.
  test('refuses to save a name another item already has, and says why', async ({
    page,
  }) => {
    await addViaSearch(page, 'Milk');
    await addViaSearch(page, 'Bread');
    await expect(page.getByText('1 x Bread')).toBeVisible({ timeout: 10_000 });

    await page.getByText('1 x Milk').click();
    await expect(nameBox(page)).toBeVisible({ timeout: 10_000 });
    const save = saveButton(page);

    await nameBox(page).fill('Bread');
    await expect(save).toBeDisabled();
    await expect(
      editDialog(page).getByText('Der Name existiert bereits')
    ).toBeVisible();

    // Blank is the other rule the schema carries — whitespace included, which the
    // built-in `required()` would have accepted.
    await nameBox(page).fill('   ');
    await expect(save).toBeDisabled();
    await expect(
      editDialog(page).getByText('Der Name darf nicht leer sein')
    ).toBeVisible();

    // Its own name is not a duplicate of itself, so the dialog recovers.
    await nameBox(page).fill('Milk');
    await expect(save).toBeEnabled();
    await expect(
      editDialog(page).getByText('Der Name existiert bereits')
    ).toHaveCount(0);
  });

  // Drives the shared category picker (the Stage-1 custom selectable list): open
  // it from the edit dialog, create a new category, confirm (multi mode), save,
  // then re-open the item to prove the category folded into the draft + persisted.
  test('assigns a category via the picker', async ({ page }) => {
    await addViaSearch(page, 'Cheese');
    await expect(page.getByText('1 x Cheese')).toBeVisible({ timeout: 10_000 });
    await page.getByText('1 x Cheese').click();

    // open the picker from the category-input row
    await expect(nameBox(page)).toBeVisible({ timeout: 10_000 });
    await editDialog(page).getByTestId('category-input-trigger').click();

    // The picker's <ion-modal> teleports to the app root, so its Confirm button
    // ("Auswählen") signals it opened; its searchbar is then the last one on the
    // page (the list-page searchbar is behind it, same placeholder).
    await expect(page.getByRole('button', { name: 'Auswählen' })).toBeVisible({
      timeout: 10_000,
    });
    const pickerSearch = page
      .getByTestId('category-picker-search')
      .locator('input');
    await pickerSearch.fill('Fridge');

    // tap the "create" row (its appearance is the debounce having landed), then
    // confirm the now-selected category (multi mode)
    const createFridge = page.getByText('Fridge erstellen');
    await expect(createFridge).toBeVisible({ timeout: 10_000 });
    await createFridge.click();
    await page.getByRole('button', { name: 'Auswählen' }).click();

    await expect(
      editDialog(page).locator('app-category-input').getByText('Fridge')
    ).toBeVisible({ timeout: 10_000 });
    await saveButton(page).click();

    // re-open the item → the category persisted onto it
    await expect(page.getByText('1 x Cheese')).toBeVisible({ timeout: 10_000 });
    await page.getByText('1 x Cheese').click();
    await expect(
      editDialog(page).locator('app-category-input').getByText('Fridge')
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
