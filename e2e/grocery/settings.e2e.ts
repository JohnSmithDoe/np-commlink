import { expect, test } from '@playwright/test';
import { waitForListPage } from '../helpers';

/**
 * The toggle's `aria-checked` flips through an async NgRx round-trip
 * (`toggleFlag` → effect → `updateSettings` → signal → `[checked]`), and Ionic
 * *also* flips it optimistically on click — so the attribute passes through
 * transient values before it settles. The old test read the settled value back
 * into a variable after a poll (a check-then-act re-read) and asserted against
 * that; catching a transient there was the CI flake. Instead we derive the exact
 * expected post-toggle value from the settled `before` and assert it with a
 * web-first, retrying `toHaveAttribute` — which waits for the definitive value.
 */
test.describe('list-settings', () => {
  test('toggles a setting flag', async ({ page }) => {
    await page.goto('/#/list-settings');
    const toggle = page.locator('ion-toggle').first();
    await expect(toggle).toBeVisible({ timeout: 30_000 });

    const before = await toggle.getAttribute('aria-checked');
    const expected = before === 'true' ? 'false' : 'true';
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', expected);
  });

  test('keeps the toggle state when navigating away and back', async ({
    page,
  }) => {
    await page.goto('/#/list-settings');
    const toggle = page.locator('ion-toggle').first();
    await expect(toggle).toBeVisible({ timeout: 30_000 });

    const before = await toggle.getAttribute('aria-checked');
    const expected = before === 'true' ? 'false' : 'true';
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', expected);

    await page.goto('/#/storage/_storage');
    await waitForListPage(page);
    await page.goto('/#/list-settings');

    const toggleAgain = page.locator('ion-toggle').first();
    await expect(toggleAgain).toBeVisible();
    await expect(toggleAgain).toHaveAttribute('aria-checked', expected);
  });
});
