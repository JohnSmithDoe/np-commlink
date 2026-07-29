import { expect, test } from '@playwright/test';
import { waitForPersisted } from '../helpers';

/**
 * Wiring guard for the LAZY office-time context.
 *
 * `/office-time` and `/office-time/settings` share one componentless subtree that
 * spreads `officeTimeContext`, so the slice registers once and activation blocks
 * on `moduleHydrationResolver(OfficeTimeActions.load, .loaded)`. If the load
 * effect were dropped from that bundle, or the resolver mis-wired, the resolver
 * would await `[OfficeTime] loaded` forever and neither page would ever paint.
 *
 * The dashboard is a grid of `@defer (on viewport)` cards driven by
 * `visibleDashboardItems()`, which needs both `dashboardItems` and
 * `dashboardSettings` hydrated — so seeing a card at all proves the hydration
 * reached the page, not just the route.
 */
const LOG_OFFICE_DAY = 'Bürotag erfassen';
const OFFICE_DAY_LOGGED = 'Bürotag erfasst.';

test.describe('office-time (lazy)', () => {
  test('hydrates and paints the dashboard cards', async ({ page }) => {
    await page.goto('/#/office-time');

    const dashboard = page.locator('#main-content app-page-office-time');
    await expect(dashboard).toBeVisible({ timeout: 30_000 });

    // Two of the cards the default `dashboardItems` order puts above the fold.
    await expect(dashboard.locator('app-dash-date')).toBeVisible({
      timeout: 30_000,
    });
    await expect(dashboard.locator('app-dash-button')).toBeVisible();
  });

  test('keeps a logged office day across a full reload', async ({ page }) => {
    await page.goto('/#/office-time');

    const dashboard = page.locator('#main-content app-page-office-time');
    const logButton = dashboard.locator('app-dash-button ion-button');
    await expect(dashboard.getByText(LOG_OFFICE_DAY)).toBeVisible({
      timeout: 30_000,
    });

    await logButton.click();

    // The card reports the logged day by swapping its own label — the office-day
    // list is derived state, so this is the domain's own read-back.
    await expect(dashboard.getByText(OFFICE_DAY_LOGGED)).toBeVisible();
    await waitForPersisted(page, 'officeTime');

    await page.reload();

    const reloaded = page.locator('#main-content app-page-office-time');
    await expect(reloaded.getByText(OFFICE_DAY_LOGGED)).toBeVisible({
      timeout: 30_000,
    });
  });

  test('reaches the settings page from the dashboard header', async ({
    page,
  }) => {
    await page.goto('/#/office-time');

    const dashboard = page.locator('#main-content app-page-office-time');
    await expect(dashboard).toBeVisible({ timeout: 30_000 });

    await dashboard.getByTestId('office-time-settings-link').click();

    await expect(page).toHaveURL(/#\/office-time\/settings$/);
    await expect(
      page.locator('#main-content app-page-office-time-settings')
    ).toBeVisible({ timeout: 30_000 });
  });
});
