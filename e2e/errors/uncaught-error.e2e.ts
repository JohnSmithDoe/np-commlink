/* ─── why ─────────────────────────────────────────────────────────
 * What this proves is the CHAIN, which no unit spec can reach:
 * `window.onerror` → `provideBrowserGlobalErrorListeners()` →
 * `GlobalErrorHandler` → `AlertController`. Before it existed the throw
 * went nowhere at all, which on the APK is a silent dead screen.
 *
 * The throw is raised from a `setTimeout` on purpose. That is exactly the
 * half Angular's own `ErrorHandler` cannot see, so removing
 * `provideBrowserGlobalErrorListeners()` reddens this spec where a throw
 * from inside Angular would still be caught.
 *
 * Waiting for the deck first is what separates "the app reported an
 * error" from "the app failed to boot".
 *
 * The suite's `:not(.overlay-hidden)` narrowing applies to `ion-alert`
 * too, and the title is what picks THIS alert out of any other the app
 * might present.
 *
 * Its own file, because the alert's only action reloads the app.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';

function alert(page: Page) {
  return page
    .locator('ion-alert:not(.overlay-hidden)')
    .filter({ hasText: 'Etwas ist schiefgelaufen' });
}

test.describe('uncaught errors', () => {
  test('reports the error in an alert whose only way out is a reload', async ({
    page,
  }) => {
    await page.goto('/#/commlink');
    await expect(page.locator('app-page-commlink')).toBeVisible();

    await page.evaluate(() =>
      setTimeout(() => {
        throw new Error('boom from outside angular');
      })
    );

    await expect(alert(page)).toBeVisible();
    await expect(alert(page)).toContainText('boom from outside angular');
    await expect(alert(page).locator('button')).toHaveCount(1);
    await expect(alert(page).locator('button')).toHaveText(/Neu laden/);
  });

  test('presents one alert however many times it throws', async ({ page }) => {
    await page.goto('/#/commlink');
    await expect(page.locator('app-page-commlink')).toBeVisible();

    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('first');
      });
      setTimeout(() => {
        throw new Error('second');
      });
      setTimeout(() => {
        throw new Error('third');
      });
    });

    await expect(alert(page)).toBeVisible();
    await expect(page.locator('ion-alert:not(.overlay-hidden)')).toHaveCount(1);
  });
});
