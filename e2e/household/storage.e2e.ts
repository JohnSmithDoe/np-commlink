/* ─── why ─────────────────────────────────────────────────────────
 * Storage is where the shared list-page behaviour is proved once for all
 * three household lists; shopping and tasks only check their own wiring.
 *
 * The filter test needs no wait against the 250 ms debounce, unlike
 * `addViaSearch`: both of its assertions retry, so they outlast it.
 *
 * The round-trip test reloads AFTER `gotoFeature`, never after a bare
 * `goto`: a hash navigation is same-document, so reloading too early
 * reloads the route just left and the spec proves nothing.
 *
 * The name-rule test asserts the MESSAGE beside the disabled button,
 * because the disabled button alone let it regress once — Ionic renders
 * its `errorText` slot only while the `ion-input` carries `ion-invalid
 * ion-touched`, which only an `NgControl` on that input produces. The
 * recovery at the end is `requireUniqueName`'s `editing` exclusion.
 *
 * The picker runs in MULTI mode, so "Auswählen" confirms it — and that
 * button appearing is what says it opened. Its searchbar cannot be found
 * by placeholder: the list page's own is behind it with the same one.
 *
 * The suggestion-stack test is the only thing proving TWO elements reach
 * ONE `<ng-content select="[beforeList]">`. It enables both flags first,
 * because every `ListSettings` flag ships `false`.
 *
 * The undo tests live here because they prove what trackplay's does not: a
 * list opting in through `undoableDelete` gets its row back from the toast,
 * and from the header button for the entry the toast has replaced.
 *
 * The emoji test asserts ABSENCE: an always-mounted `ion-modal` would
 * make every overlay locator on this route ambiguous, app-wide.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  addViaSearch,
  gotoFeature,
  listRow,
  presentedDialog,
  ROUTE,
  searchInput,
  slideDelete,
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

async function enableFlag(page: Page, flag: string): Promise<void> {
  const toggle = page.getByTestId(`list-settings-flag-${flag}`);
  await expect(toggle).toBeVisible({ timeout: 30_000 });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
}

test.describe('storage list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/household/storage');
    await waitForListPage(page);
  });

  test('adds an item through the searchbar', async ({ page }) => {
    await addViaSearch(page, 'Bananas');
    await expect(listRow(page, /Bananas/)).toBeVisible({ timeout: 10_000 });
  });

  test('stacks quick-add and the cross-list suggestion above the list', async ({
    page,
  }) => {
    await gotoFeature(page, ROUTE.shopping);
    await addViaSearch(page, 'Bananas');
    await expect(listRow(page, /Bananas/)).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/household/list-settings');
    await enableFlag(page, 'show-quick-add');
    await enableFlag(page, 'show-shopping-in-storage');

    await gotoFeature(page, ROUTE.storage);
    const input = searchInput(page);
    await input.click();
    await input.fill('Bana');

    const quickAdd = page
      .locator('app-item-list-quick-add app-text-item:visible')
      .first();
    const suggestion = page
      .locator('app-household-search-panel app-text-item:visible')
      .first();
    await expect(quickAdd).toBeVisible({ timeout: 10_000 });
    await expect(suggestion).toContainText('Aus der Einkaufsliste');

    const quickAddBox = await quickAdd.boundingBox();
    const suggestionBox = await suggestion.boundingBox();
    const emptyBox = await page
      .locator('app-item-list-empty app-text-item:visible')
      .first()
      .boundingBox();
    expect(quickAddBox!.y).toBeLessThan(suggestionBox!.y);
    expect(suggestionBox!.y).toBeLessThan(emptyBox!.y);
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

  test('keeps spaces typed into the query, across a debounce flush', async ({
    page,
  }) => {
    const input = searchInput(page);
    await input.click();
    await input.pressSequentially('Hell');
    await page.waitForTimeout(400);
    await input.pressSequentially('o ');
    await page.waitForTimeout(400);
    await input.pressSequentially('World');
    await expect(input).toHaveValue('Hello World');

    await input.fill('');
    await page.waitForTimeout(400);
    await input.pressSequentially('w    ');
    await page.waitForTimeout(400);
    await expect(input).toHaveValue('w    ');
  });

  test('says why the add button greys out on an exact match', async ({
    page,
  }) => {
    await addViaSearch(page, 'Apples');

    const add = page.getByTestId('page-header-add');
    await expect(add).not.toHaveAttribute('aria-disabled', 'true');

    await searchInput(page).fill('Apples');

    await expect(page.getByTestId('exact-match-note')).toBeVisible();
    await expect(add).toHaveAttribute('aria-disabled', 'true');
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

  test('restores a deleted item from the undo toast', async ({ page }) => {
    await addViaSearch(page, 'Butter');
    const row = listRow(page, /Butter/);
    await expect(row).toBeVisible({ timeout: 10_000 });

    await slideDelete(row);
    await expect(listRow(page, /Butter/)).toHaveCount(0);

    const toast = page.getByTestId('action-toast');
    await expect(toast).toBeVisible({ timeout: 10_000 });
    await expect(toast).toContainText('Butter');

    await toast.getByRole('button', { name: 'Rückgängig' }).click();
    await expect(listRow(page, /Butter/)).toBeVisible({ timeout: 10_000 });
  });

  test('reaches an entry the toast has already replaced', async ({ page }) => {
    await addViaSearch(page, 'Butter');
    await addViaSearch(page, 'Cheese');

    await slideDelete(listRow(page, /Butter/));
    await expect(listRow(page, /Butter/)).toHaveCount(0);
    await slideDelete(listRow(page, /Cheese/));
    await expect(listRow(page, /Cheese/)).toHaveCount(0);

    const undo = page.getByTestId('undo-button');
    await expect(undo).toBeVisible({ timeout: 10_000 });

    await undo.click();
    await expect(listRow(page, /Cheese/)).toBeVisible({ timeout: 10_000 });

    await undo.click();
    await expect(listRow(page, /Butter/)).toBeVisible({ timeout: 10_000 });
    await expect(undo).toHaveCount(0);
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
