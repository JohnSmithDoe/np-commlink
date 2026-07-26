import { expect, Page, test } from '@playwright/test';
import { addViaSearch, gotoFeature, ROUTE, waitForPersisted } from '../helpers';

/**
 * SOYKAF — the recipe book. Covers what the unit tests cannot: that the route
 * co-registers the grocery context it joins against (the matcher reads products +
 * storage, so a missing sibling slice would crash the selector on entry), that a
 * recipe survives a cold reload through `npc-groceries`, and that the deck tile
 * picks up the count the recipes reporter pushes.
 */

const SOYKAF = '/#/soykaf';

/**
 * The recipe page's add affordance. Scoped to `app-page-recipes` because Ionic
 * keeps previously-visited routes mounted, so a grocery page's identical add
 * button is still in the DOM after an SPA navigation.
 */
function addButton(page: Page) {
  return page
    .locator('app-page-recipes')
    .getByRole('button', { name: 'Hinzufügen' });
}

async function gotoSoykaf(page: Page): Promise<void> {
  await page.goto(SOYKAF);
  await expect(addButton(page)).toBeVisible({ timeout: 30_000 });
}

// The dialog's <ion-modal> teleports to the app root, so key off its title
// rather than the wrapper element (same as the grocery specs).
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
    // No ingredients yet, so nothing can be missing — the matcher reads cookable.
    await expect(row.getByText('Kochbar')).toBeVisible();
  });

  test('keeps the recipe across a cold reload', async ({ page }) => {
    await gotoSoykaf(page);
    await createRecipe(page, 'Zwiebelsuppe');
    // Recipes are an aggregate of the one grocery slice, so they land in the
    // grocery doc rather than a `npc-recipes` of their own.
    await waitForPersisted(page, 'groceries', 'Zwiebelsuppe');

    await page.reload();

    await expect(
      page.locator('#main-content ion-item', { hasText: 'Zwiebelsuppe' })
    ).toBeVisible({ timeout: 30_000 });
  });

  // The featured function end to end: an ingredient references a catalog
  // product, and the verdict flips as soon as that product is in storage.
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
    // Click the ion-select host: its shadow `part="inner"` swallows a click
    // aimed at the accessible button.
    await page.locator('ion-modal ion-select').first().click();
    await page.getByRole('radio', { name: 'Milk' }).click();
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(row.getByText('Fehlt: Milk')).toBeVisible({ timeout: 10_000 });

    await gotoFeature(page, ROUTE.storage);
    await addViaSearch(page, 'Milk');

    await page.goto(SOYKAF);
    await expect(row.getByText('Kochbar')).toBeVisible({ timeout: 10_000 });
  });

  test('reports the recipe count to the deck tile', async ({ page }) => {
    await gotoSoykaf(page);
    await createRecipe(page, 'Pancakes');
    await waitForPersisted(page, 'summary-recipes');

    await page.goto('/#/commlink');

    await expect(
      page
        .locator('#main-content .cl-node', { hasText: 'SOYKAF' })
        .locator('.cl-node__badge')
    ).toHaveText('1');
  });
});
