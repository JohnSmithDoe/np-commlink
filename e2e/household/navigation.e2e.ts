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

  test('switches between the three lists from the tab bar', async ({
    page,
  }) => {
    const tabs = pageRoot(page, 'app-page-household-tabs');

    const switched = async (
      route: (typeof ROUTE)[keyof typeof ROUTE],
      tab: string
    ) => {
      await expect(page).toHaveURL(
        new RegExp(route.replace('/', String.raw`\/`))
      );
      await waitForListPage(page);
      await expect(tabs.getByTestId(`list-switcher-${tab}`)).toHaveClass(
        /tab-selected/
      );
    };

    await gotoFeature(page, ROUTE.storage);
    await switched(ROUTE.storage, 'storage');

    await tabs.getByTestId('list-switcher-shopping').click();
    await switched(ROUTE.shopping, 'shopping');

    await tabs.getByTestId('list-switcher-products').click();
    await switched(ROUTE.products, 'products');

    await tabs.getByTestId('list-switcher-storage').click();
    await switched(ROUTE.storage, 'storage');
  });

  test('hides the tab bar on a sub-page, and restores the list behind it', async ({
    page,
  }) => {
    await gotoFeature(page, ROUTE.storage);
    const tabs = pageRoot(page, 'app-page-household-tabs');
    await expect(tabs.getByTestId('list-switcher-storage')).toBeVisible();

    await page.goto('/#/household/list-settings');
    await expect(
      page.getByTestId('list-settings-flag-show-quick-add')
    ).toBeVisible({ timeout: 30_000 });
    await expect(tabs.getByTestId('list-switcher-storage')).toBeHidden();

    await page.goBack();
    await waitForListPage(page);
    await expect(tabs.getByTestId('list-switcher-storage')).toHaveClass(
      /tab-selected/
    );
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
