/* ─── why ─────────────────────────────────────────────────────────
 * `aria-checked` on this toggle passes through transient values: it flips
 * through an async NgRx round-trip (`toggleFlag` → effect →
 * `updateSettings` → signal → `[checked]`) while Ionic ALSO flips it
 * optimistically on the click.
 *
 * So the expected value is derived from the settled `before` and handed
 * to a web-first, retrying `toHaveAttribute`, which waits for the
 * definitive one. The version that polled and then read the settled value
 * back into a variable was a check-then-act, and catching a transient in
 * that gap was the CI flake.
 *
 * The reload in the second test is what makes the read-back cold — and
 * collapses the two mounted copies of this page down to one.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { waitForListPage, waitForPersisted } from '../helpers';

test.describe('list-settings', () => {
  test('toggles a setting flag', async ({ page }) => {
    await page.goto('/#/household/list-settings');
    const toggle = page.getByTestId('list-settings-flag-show-quick-add');
    await expect(toggle).toBeVisible({ timeout: 30_000 });

    const before = await toggle.getAttribute('aria-checked');
    const expected = before === 'true' ? 'false' : 'true';
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', expected);
  });

  test('keeps the toggle state when navigating away and back', async ({
    page,
  }) => {
    await page.goto('/#/household/list-settings');
    const toggle = page.getByTestId('list-settings-flag-show-quick-add');
    await expect(toggle).toBeVisible({ timeout: 30_000 });

    const before = await toggle.getAttribute('aria-checked');
    const expected = before === 'true' ? 'false' : 'true';
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', expected);
    await waitForPersisted(page, 'household', `"showQuickAdd":${expected}`);

    await page.goto('/#/household/storage');
    await waitForListPage(page);
    await page.goto('/#/household/list-settings');
    await page.reload();

    const toggleAgain = page.getByTestId('list-settings-flag-show-quick-add');
    await expect(toggleAgain).toBeVisible({ timeout: 30_000 });
    await expect(toggleAgain).toHaveAttribute('aria-checked', expected);
  });
});
