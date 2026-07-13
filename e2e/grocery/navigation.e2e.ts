import { expect, test } from '@playwright/test';
import { gotoFeature, ROUTE } from '../helpers';

test.describe('grocery navigation', () => {
  test('redirects the root url to the commlink deck', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/commlink/);
    await expect(page.locator('app-page-commlink')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('opens each grocery feature by its hash url', async ({ page }) => {
    await gotoFeature(page, ROUTE.shopping);
    await gotoFeature(page, ROUTE.tasks);
    await gotoFeature(page, ROUTE.storage);
    await gotoFeature(page, ROUTE.products);
  });

  test('opens the list-settings page', async ({ page }) => {
    await page.goto('/#/list-settings');
    await expect(page.locator('ion-toggle').first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
