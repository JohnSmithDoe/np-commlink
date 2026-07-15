import { expect, test } from '@playwright/test';
import { waitForListPage } from '../helpers';

test.describe('list-settings', () => {
  test('toggles a setting flag', async ({ page }) => {
    await page.goto('/#/list-settings');
    const toggle = page.locator('ion-toggle').first();
    await expect(toggle).toBeVisible({ timeout: 30_000 });

    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();

    await expect
      .poll(() => toggle.getAttribute('aria-checked'))
      .not.toBe(before);
  });

  test('keeps the toggle state when navigating away and back', async ({
    page,
  }) => {
    await page.goto('/#/list-settings');
    const toggle = page.locator('ion-toggle').first();
    await expect(toggle).toBeVisible({ timeout: 30_000 });

    const before = await toggle.getAttribute('aria-checked');
    await toggle.click();
    // Wait for the click to actually flip the toggle before capturing the
    // expected value — reading immediately races the stale pre-click value.
    await expect.poll(() => toggle.getAttribute('aria-checked')).not.toBe(before);
    const checked = await toggle.getAttribute('aria-checked');

    await page.goto('/#/storage/_storage');
    await waitForListPage(page);
    await page.goto('/#/list-settings');

    const toggleAgain = page.locator('ion-toggle').first();
    await expect(toggleAgain).toBeVisible();
    await expect
      .poll(() => toggleAgain.getAttribute('aria-checked'))
      .toBe(checked);
  });
});
