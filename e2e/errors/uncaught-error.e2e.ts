import { expect, Page, test } from '@playwright/test';

/**
 * Acceptance test for the global error handler. The value is the *chain*, which
 * no unit spec can reach: a genuinely uncaught error thrown outside Angular has
 * to travel `window.onerror` → `provideBrowserGlobalErrorListeners()` →
 * `GlobalErrorHandler` → `AlertController`. Before this existed the throw went
 * nowhere at all, which on the APK is a silent dead screen.
 *
 * The throw is deliberately raised from a `setTimeout`, not from Angular code:
 * that is the half Angular's own `ErrorHandler` cannot see on its own, so a
 * missing `provideBrowserGlobalErrorListeners()` would make this spec red.
 *
 * Lives in its own file because the alert's only action reloads the app.
 */

/**
 * The presented alert. Ionic teleports overlays to the app root and leaves an
 * `overlay-hidden` twin behind, so `.show-modal`-style narrowing applies here
 * too — an `ion-alert` matched by element name alone can match a hidden one
 * (§10). Keying off the title is what picks *this* alert.
 */
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
    // The deck is up before the throw, so the alert cannot be mistaken for a
    // boot failure.
    await expect(page.locator('app-page-commlink')).toBeVisible();

    await page.evaluate(() =>
      setTimeout(() => {
        throw new Error('boom from outside angular');
      })
    );

    await expect(alert(page)).toBeVisible();
    // The reason is carried into the message — the "report" half of the contract.
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
