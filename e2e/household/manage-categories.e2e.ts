/* ─── why ─────────────────────────────────────────────────────────
 * The household category catalog, which had no coverage at all while an
 * identically-named spec in this folder drove `/#/tasks/list` — so the
 * tasks slice was green and this one was broken for every write path.
 * That spec now lives in `e2e/tasks/`, and this is the household half it
 * was standing in for.
 *
 * All three tests here failed before `household-categories.effects.ts`
 * existed, and each covers a DIFFERENT unhandled action rather than the
 * same one three ways:
 *   - the + button dispatches `addOrUpdateItem` (the reported bug),
 *   - the searchbar dispatches `addItemFromSearch`,
 *   - the rename swipe dispatches `addOrUpdateItem` for a known id.
 * Delete was never broken — `removeItem` is in the catalog cascade — so
 * it is not re-asserted here; `e2e/tasks/manage-categories.e2e.ts`
 * carries the shared page's remaining behaviour.
 *
 * `addViaCatalogSearch` is a local copy of `addViaSearch` for the reason
 * the tasks spec documents: the storage list this page was opened from is
 * still mounted, so the shared helper's FIRST-visible searchbar would
 * type into it and add a STORAGE ITEM, and the spec would pass having
 * proved nothing. `catalogRow` is scoped for the same reason.
 *
 * The persistence assertion is the second half of the fix: a dispatch
 * that reaches no reducer also writes nothing, so `npc-household`
 * containing the name is what proves the action landed in state rather
 * than merely rendering.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import {
  openRowSwipe,
  pageRoot,
  slideDelete,
  presentedDialog,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

const catalogPage = (page: Page) => pageRoot(page, 'app-page-category-list');

const catalogRow = (page: Page, name: string) =>
  catalogPage(page).getByTestId('list-row').filter({ hasText: name });

async function openCatalog(page: Page) {
  await page
    .getByRole('button', { name: 'Kategorien verwalten' })
    .first()
    .click();
  await expect(page).toHaveURL(/household\/categories/);
  await expect(catalogPage(page)).toBeVisible({ timeout: 10_000 });
}

async function addViaCatalogSearch(page: Page, name: string) {
  const input = catalogPage(page).locator('ion-searchbar input');
  await input.click();
  await input.fill(name);
  await page.waitForTimeout(400); // > the searchbar's 250ms debounce
  await input.press('Enter');
  await input.fill('');
  await page.waitForTimeout(400);
}

test.describe('household category catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/household/storage');
    await waitForListPage(page);
    await openCatalog(page);
  });

  test('adds a category through the + button dialog', async ({ page }) => {
    await page.getByTestId('page-header-add').last().click();

    const dialog = presentedDialog(page, 'Neuen Eintrag anlegen');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByPlaceholder('Gib einen Namen ein').fill('Tiefkühl');
    await dialog.getByRole('button', { name: 'Anlegen' }).click();

    await expect(catalogRow(page, 'Tiefkühl')).toBeVisible({ timeout: 10_000 });
    await waitForPersisted(page, 'household', 'Tiefkühl');
  });

  test('adds a category through the searchbar', async ({ page }) => {
    await addViaCatalogSearch(page, 'Getränke');

    await expect(catalogRow(page, 'Getränke')).toBeVisible({ timeout: 10_000 });
    await waitForPersisted(page, 'household', 'Getränke');
  });

  test('renames a category instead of adding a second one', async ({
    page,
  }) => {
    await addViaCatalogSearch(page, 'Tiefkuhl');
    await expect(catalogRow(page, 'Tiefkuhl')).toBeVisible({ timeout: 10_000 });

    const row = catalogRow(page, 'Tiefkuhl');
    await openRowSwipe(row, 'start');
    await row.locator('ion-item-option').first().click();

    const dialog = presentedDialog(page, 'Eintrag bearbeiten');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByPlaceholder('Gib einen Namen ein').fill('Tiefkühl');
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(catalogRow(page, 'Tiefkühl')).toBeVisible({ timeout: 10_000 });
    await expect(catalogRow(page, 'Tiefkuhl')).toHaveCount(0);
  });

  test('undo puts a deleted category back on the rows it was stripped from', async ({
    page,
  }) => {
    await addViaCatalogSearch(page, 'Tiefkuehl');
    await expect(catalogRow(page, 'Tiefkuehl')).toBeVisible({
      timeout: 10_000,
    });

    await slideDelete(catalogRow(page, 'Tiefkuehl'));
    await expect(catalogRow(page, 'Tiefkuehl')).toHaveCount(0);

    const undo = catalogPage(page).getByTestId('undo-button');
    await expect(undo).toBeVisible({ timeout: 10_000 });
    await undo.click();

    await expect(catalogRow(page, 'Tiefkuehl')).toBeVisible({
      timeout: 10_000,
    });
    await expect(undo).toHaveCount(0);
  });
});
