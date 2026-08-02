/* ─── why ─────────────────────────────────────────────────────────
 * Storage is where the shared list-page behaviour is proved once for all
 * three household lists; shopping and tasks only check their own wiring.
 *
 * The filter test needs no wait against the 250 ms debounce, unlike
 * `addViaSearch`: both of its assertions retry, so they outlast it on
 * their own.
 *
 * The round-trip test reloads AFTER `gotoFeature`, never after a bare
 * `goto`. A hash navigation is same-document, so reloading too early
 * reloads the route just left and the spec proves nothing.
 *
 * The name-rule test is where the move onto Signal Forms is actually
 * proven: the save button reads `canSave` off the field tree, where it
 * used to read validity off the name input through a template ref. The
 * MESSAGE is asserted beside the disabled button because a
 * disabled-button assertion alone let it regress once — Ionic renders its
 * own `errorText` slot only while the `ion-input` carries `ion-invalid
 * ion-touched`, classes produced exclusively by an `NgControl` on that
 * input, which a custom control never puts there. The recovery at the end
 * is `requireUniqueName`'s `editing` exclusion: an item's own name is not
 * a duplicate of itself.
 *
 * The picker runs in MULTI mode here, so a separate "Auswählen" confirms
 * it — and that button appearing is what says the picker opened. Its
 * searchbar cannot be found by placeholder: the list page's own searchbar
 * is still behind it carrying the same one.
 *
 * The emoji test asserts ABSENCE, mirroring
 * `e2e/desktop/emoji-picker.e2e.ts`. Not-rendered rather than hidden is
 * the requirement: an always-mounted `ion-modal` would make every overlay
 * locator on this route ambiguous, app-wide, for a control a phone
 * keyboard already provides.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  addViaSearch,
  gotoFeature,
  listRow,
  presentedDialog,
  ROUTE,
  searchInput,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

function editDialog(page: Page): Locator {
  return presentedDialog(page, 'Eintrag bearbeiten');
}

function nameBox(page: Page): Locator {
  return editDialog(page).getByRole('textbox', { name: 'Name' });
}

function saveButton(page: Page): Locator {
  return editDialog(page).getByRole('button', { name: 'Übernehmen' });
}

test.describe('storage list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/household/storage/_storage');
    await waitForListPage(page);
  });

  test('adds an item through the searchbar', async ({ page }) => {
    await addViaSearch(page, 'Bananas');
    await expect(listRow(page, /Bananas/)).toBeVisible({ timeout: 10_000 });
  });

  test('keeps items across a navigation round-trip', async ({ page }) => {
    await addViaSearch(page, 'Yoghurt');
    await expect(listRow(page, /Yoghurt/)).toBeVisible({ timeout: 10_000 });
    await waitForPersisted(page, 'household', 'Yoghurt');

    await gotoFeature(page, ROUTE.shopping);
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

    await expect(listRow(page, /Apples/)).toBeVisible();
    await expect(listRow(page, /Cucumber/)).toHaveCount(0);
  });

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

    const value = ' '.repeat(3);
    await nameBox(page).fill(value);
    await expect(save).toBeDisabled();
    await expect(
      editDialog(page).getByText('Der Name darf nicht leer sein')
    ).toBeVisible();

    await nameBox(page).fill('Milk');
    await expect(save).toBeEnabled();
    await expect(
      editDialog(page).getByText('Der Name existiert bereits')
    ).toHaveCount(0);
  });

  test('assigns a category via the picker', async ({ page }) => {
    await addViaSearch(page, 'Cheese');
    await expect(page.getByText('1 x Cheese')).toBeVisible({ timeout: 10_000 });
    await page.getByText('1 x Cheese').click();

    await expect(nameBox(page)).toBeVisible({ timeout: 10_000 });
    await editDialog(page).getByTestId('category-input-trigger').click();

    await expect(page.getByRole('button', { name: 'Auswählen' })).toBeVisible({
      timeout: 10_000,
    });
    const pickerSearch = page
      .getByTestId('category-picker-search')
      .locator('input');
    await pickerSearch.fill('Fridge');

    const createFridge = page.getByText('Fridge erstellen');
    await expect(createFridge).toBeVisible({ timeout: 10_000 });
    await createFridge.click();
    await page.getByRole('button', { name: 'Auswählen' }).click();

    await expect(
      editDialog(page).locator('app-category-input').getByText('Fridge')
    ).toBeVisible({ timeout: 10_000 });
    await saveButton(page).click();

    await expect(page.getByText('1 x Cheese')).toBeVisible({ timeout: 10_000 });
    await page.getByText('1 x Cheese').click();
    await expect(
      editDialog(page).locator('app-category-input').getByText('Fridge')
    ).toBeVisible({ timeout: 10_000 });
  });

  test('offers no emoji picker on mobile', async ({ page }) => {
    await addViaSearch(page, 'Milk');
    await listRow(page, /Milk/).click();
    await expect(editDialog(page)).toBeVisible({ timeout: 10_000 });

    await expect(
      editDialog(page).getByTestId('emoji-picker-trigger')
    ).toHaveCount(0);
    await expect(page.locator('app-emoji-picker')).toHaveCount(0);
  });
});
