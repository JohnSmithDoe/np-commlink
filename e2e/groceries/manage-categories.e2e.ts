import { expect, Page, test } from '@playwright/test';
import {
  openRowSwipe,
  pageRoot,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

// The catalog on the shared LIST page + the category→items drill. Real-browser
// only: the drill navigates with `?filter=<id>` and the target list applies it in
// ionViewWillEnter (after the resolver re-hydrates), which jsdom cannot exercise.
const catalogPage = (page: Page) => pageRoot(page, 'app-page-category-list');

async function openCatalog(page: Page) {
  await page
    .getByRole('button', { name: 'Kategorien verwalten' })
    .first()
    .click();
  await expect(page).toHaveURL(/tasks\/categories/);
  await expect(catalogPage(page)).toBeVisible({ timeout: 10_000 });
}

/**
 * Add via the catalog's own searchbar — the same affordance every list has, where
 * the manage page had a bespoke input row.
 *
 * Deliberately NOT the shared `addViaSearch` helper: it takes the FIRST visible
 * searchbar, and the task list page it was opened from is still mounted, so the
 * typing lands on the task list and adds a task. Scoping to `app-page-<x>` is the
 * standing rule for exactly this reason.
 */
async function addCategory(page: Page, name: string) {
  const input = catalogPage(page).locator('ion-searchbar input');
  await input.click();
  await input.fill(name);
  await page.waitForTimeout(400); // > the searchbar's 250ms debounce
  await input.press('Enter');
  await input.fill('');
  await page.waitForTimeout(400);
  await expect(catalogRow(page, name)).toBeVisible({ timeout: 10_000 });
}

// A row of THIS page, for the same reason — a task row of the same name would
// otherwise match too.
const catalogRow = (page: Page, name: string) =>
  catalogPage(page).getByTestId('list-row').filter({ hasText: name });

test.describe('manage categories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/tasks/list');
    await waitForListPage(page);
  });

  test('adds a category from the catalog page', async ({ page }) => {
    await openCatalog(page);
    await addCategory(page, 'Arbeit');

    // A fresh category has no items yet, so its count note reads 0.
    await expect(catalogRow(page, 'Arbeit')).toContainText('0');

    // The shared header's start slot is the menu button, so the catalog projects
    // its own back link into the toolbar. `routerLink` renders an anchor.
    await page.getByRole('link', { name: 'Zurück' }).first().click();
    await expect(page).toHaveURL(/tasks\/list$/);
  });

  test('renames a category through the shared edit dialog', async ({
    page,
  }) => {
    await openCatalog(page);
    await addCategory(page, 'Arbeit');
    await waitForPersisted(page, 'tasks', 'Arbeit');

    // Rename is the row's start-swipe, and it opens the SHARED item dialog.
    // The manage page renamed inline, with its own confirm/cancel buttons.
    // `data-testid="list-row"` sits ON the ion-item-sliding, so the row locator IS
    // the sliding element `openRowSwipe` wants.
    const row = catalogRow(page, 'Arbeit');
    await openRowSwipe(row, 'start');
    await row.locator('ion-item-option').first().click();

    const nameInput = page
      .locator('ion-modal.show-modal')
      .getByPlaceholder('Gib einen Namen ein');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill('Büro');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(catalogRow(page, 'Büro')).toBeVisible({ timeout: 10_000 });
  });

  test('drills from a category into the filtered list', async ({ page }) => {
    await openCatalog(page);
    await addCategory(page, 'Arbeit');
    await waitForPersisted(page, 'tasks', 'Arbeit');

    // Tapping the row drills, rather than opening the dialog the way an item row
    // would — the one gesture a catalog row spends differently.
    await catalogRow(page, 'Arbeit').click();

    await expect(page).toHaveURL(/tasks\/list\?filter=/);
    await expect(
      page.locator('#main-content').getByText(/Kategorie: Arbeit/)
    ).toBeVisible({ timeout: 10_000 });
  });
});
