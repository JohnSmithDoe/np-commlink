/* ─── why ─────────────────────────────────────────────────────────
 * SOYKAF joins three aggregates of one slice, so what only a real browser
 * can show is that `/soykaf` co-registers the whole household context it
 * reads: the matcher joins recipes against products AND storage, and a
 * missing sibling would crash the selector on entry. Recipes persist into
 * the shared `npc-household` doc rather than an `npc-recipes` of their
 * own, which is why the persistence waits key on `household`.
 *
 * A recipe with no ingredients reads "Kochbar": nothing can be missing,
 * so the empty verdict is cookable rather than unknown.
 *
 * The two match tests are deliberately different halves. The first proves
 * only the NAME fallback, because `addViaSearch` types a pantry row by
 * hand and a hand-typed row carries no catalog link at all. The second is
 * the id half, and it needs the cross-list bucket — the only non-native
 * way to get a PRODUCT into storage, and off by default — so that the
 * pantry row is a copy of the product, `productId` and all. Renaming the
 * product afterwards is the regression: before `productId` the storage
 * row still said "Milk" while the product had become "Oat milk", and the
 * recipe silently went uncookable.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import {
  addViaSearch,
  gotoFeature,
  mainContent,
  presentedDialog,
  ROUTE,
  searchInput,
  waitForPersisted,
} from '../helpers';

const SOYKAF = '/#/soykaf';

function addButton(page: Page) {
  return page
    .locator('app-page-recipes')
    .getByRole('button', { name: 'Hinzufügen' });
}

async function gotoSoykaf(page: Page): Promise<void> {
  await page.goto(SOYKAF);
  await expect(addButton(page)).toBeVisible({ timeout: 30_000 });
}

async function createRecipe(page: Page, name: string): Promise<void> {
  await addButton(page).click();
  await expect(page.getByText('Neuen Eintrag anlegen')).toBeVisible({
    timeout: 10_000,
  });

  await page.getByPlaceholder('Gib einen Namen ein').fill(name);
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByText('Neuen Eintrag anlegen')).toBeHidden({
    timeout: 10_000,
  });
}

test.describe('soykaf recipe book', () => {
  test('paints the matcher and creates a recipe', async ({ page }) => {
    await gotoSoykaf(page);
    await createRecipe(page, 'Pancakes');

    const row = page.locator('#main-content ion-item', {
      hasText: 'Pancakes',
    });
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row.getByText('Kochbar')).toBeVisible();
  });

  test('keeps the recipe across a cold reload', async ({ page }) => {
    await gotoSoykaf(page);
    await createRecipe(page, 'Zwiebelsuppe');
    await waitForPersisted(page, 'household', 'Zwiebelsuppe');

    await page.reload();

    await expect(
      page.locator('#main-content ion-item', { hasText: 'Zwiebelsuppe' })
    ).toBeVisible({ timeout: 30_000 });
  });

  test('flips a recipe from missing to cookable when storage gets the product', async ({
    page,
  }) => {
    await gotoFeature(page, ROUTE.products);
    await addViaSearch(page, 'Milk');

    await gotoSoykaf(page);
    await createRecipe(page, 'Pancakes');

    const row = page.locator('#main-content ion-item', { hasText: 'Pancakes' });
    await row.click();
    await expect(page.getByText('Eintrag bearbeiten')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId('recipe-product-select').click();
    await page.getByRole('radio', { name: 'Milk' }).click();
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(row.getByText('Fehlt: Milk')).toBeVisible({ timeout: 10_000 });

    await gotoFeature(page, ROUTE.storage);
    await addViaSearch(page, 'Milk');

    await page.goto(SOYKAF);
    await expect(row.getByText('Kochbar')).toBeVisible({ timeout: 10_000 });
  });

  test('keeps a recipe cookable after its product is renamed', async ({
    page,
  }) => {
    await page.goto('/#/household/list-settings');
    const showProductsInStorage = page.getByTestId(
      'list-settings-flag-show-products-in-storage'
    );
    await expect(showProductsInStorage).toBeVisible({ timeout: 30_000 });
    await showProductsInStorage.click();
    await expect(showProductsInStorage).toHaveAttribute('aria-checked', 'true');

    await gotoFeature(page, ROUTE.products);
    await addViaSearch(page, 'Milk');

    await gotoFeature(page, ROUTE.storage);
    await searchInput(page).fill('Milk');
    const fromCatalog = page
      .locator('app-page-storage app-item-list', {
        hasText: 'Aus den dauerhaften Einträgen',
      })
      .locator('app-text-item', { hasText: 'Milk' });
    await expect(fromCatalog).toBeVisible({ timeout: 10_000 });
    await fromCatalog.click();
    await searchInput(page).fill('');

    await gotoSoykaf(page);
    await createRecipe(page, 'Pancakes');
    const row = page.locator('#main-content ion-item', { hasText: 'Pancakes' });
    await row.click();
    await expect(page.getByText('Eintrag bearbeiten')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId('recipe-product-select').click();
    await page.getByRole('radio', { name: 'Milk' }).click();
    await page.getByRole('button', { name: 'Übernehmen' }).click();
    await expect(row.getByText('Kochbar')).toBeVisible({ timeout: 10_000 });

    await gotoFeature(page, ROUTE.products);
    await page
      .locator('app-page-products')
      .getByTestId('list-row')
      .filter({ hasText: 'Milk' })
      .click();
    const nameBox = presentedDialog(page, 'Eintrag bearbeiten').getByRole(
      'textbox',
      { name: 'Name' }
    );
    await expect(nameBox).toBeVisible({ timeout: 10_000 });
    await nameBox.fill('Oat milk');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await page.goto(SOYKAF);
    await expect(row.getByText('Kochbar')).toBeVisible({ timeout: 10_000 });
  });

  test('reports the recipe count to the deck tile', async ({ page }) => {
    await gotoSoykaf(page);
    await createRecipe(page, 'Pancakes');
    await waitForPersisted(page, 'summary-recipes');

    await page.goto('/#/commlink');

    await expect(
      mainContent(page)
        .getByTestId('deck-tile')
        .filter({ hasText: 'SOYKAF' })
        .getByTestId('deck-tile-badge')
    ).toHaveText('1');
  });
});
