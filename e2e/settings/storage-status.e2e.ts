/* ─── why ─────────────────────────────────────────────────────────
 * The row is read from `navigator.storage.persisted()` at paint, which jsdom
 * does not implement at all — so a unit spec can prove the reader and only a
 * browser can prove the row. Which of the two answers headless Chromium gives
 * is not the point and is not asserted: what matters is that the grant stops
 * being swallowed in `provideAppInitializer` and reaches a surface.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';

const settingsPage = (page: Page) => page.locator('app-page-settings');

test.describe('storage status', () => {
  test('says what the browser granted', async ({ page }) => {
    await page.goto('/#/settings');
    await page.reload();

    const status = settingsPage(page).getByTestId('storage-persistence');
    await expect(status).toBeVisible({ timeout: 30_000 });
    await expect(status).toHaveText(/(Nicht )?[Zz]ugesichert|Nicht verfügbar/);
  });
});
