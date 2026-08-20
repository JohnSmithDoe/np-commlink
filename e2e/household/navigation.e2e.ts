import { expect, test } from '@playwright/test';
import { gotoFeature, pageRoot, ROUTE, waitForListPage } from '../helpers';

const FLAGS = 'FLAGS';

test.describe('household navigation', () => {
  test('redirects the root url to the commlink deck', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/commlink/);
    await expect(page.locator('app-page-commlink')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('opens each household feature by its hash url', async ({ page }) => {
    await gotoFeature(page, ROUTE.shopping);
    await gotoFeature(page, ROUTE.tasks);
    await gotoFeature(page, ROUTE.storage);
    await gotoFeature(page, ROUTE.products);
  });

  test('switches between the three lists from the header segment', async ({
    page,
  }) => {
    const switched = async (route: (typeof ROUTE)[keyof typeof ROUTE]) => {
      await expect(page).toHaveURL(
        new RegExp(route.replace('/', String.raw`\/`))
      );
      await waitForListPage(page);
    };

    await gotoFeature(page, ROUTE.storage);

    await pageRoot(page, 'app-page-storage')
      .getByTestId('list-switcher-shopping')
      .click();
    await switched(ROUTE.shopping);

    await pageRoot(page, 'app-page-shopping')
      .getByTestId('list-switcher-products')
      .click();
    await switched(ROUTE.products);

    await pageRoot(page, 'app-page-products')
      .getByTestId('list-switcher-storage')
      .click();
    await switched(ROUTE.storage);
  });

  test('opens the list-settings page', async ({ page }) => {
    await page.goto('/#/household/list-settings');
    await expect(
      page.getByTestId('list-settings-flag-show-quick-add')
    ).toBeVisible({ timeout: 30_000 });
  });

  test('reaches list-settings from the list toolbar, not from the drawer', async ({
    page,
  }) => {
    await gotoFeature(page, ROUTE.storage);

    await expect(
      page
        .locator('ion-menu')
        .getByTestId('menu-row')
        .filter({ hasText: FLAGS })
    ).toHaveCount(0);

    await pageRoot(page, 'app-page-storage')
      .getByTestId('household-list-settings-link')
      .click();

    await expect(page).toHaveURL(/list-settings/);
    await expect(
      page.getByTestId('list-settings-flag-show-quick-add')
    ).toBeVisible({ timeout: 30_000 });
  });
});
