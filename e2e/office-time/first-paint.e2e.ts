import { expect, Locator, Page, test } from '@playwright/test';
import { pageRoot, waitForPersisted } from '../helpers';

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

/** The dashboard, once the lazy context has hydrated far enough to paint it. */
async function openDashboard(page: Page): Promise<Locator> {
  await page.goto('/#/office-time');
  const dashboard = pageRoot(page, 'app-page-office-time');
  await expect(dashboard).toBeVisible({ timeout: 30_000 });
  return dashboard;
}

test.describe('office-time (lazy)', () => {
  test('hydrates and paints the dashboard cards', async ({ page }) => {
    const dashboard = await openDashboard(page);

    // Two of the cards the default `dashboardItems` order puts above the fold.
    await expect(dashboard.locator('app-dash-date')).toBeVisible({
      timeout: 30_000,
    });
    await expect(dashboard.locator('app-dash-button')).toBeVisible();
  });

  test('keeps a logged office day across a full reload', async ({ page }) => {
    const dashboard = await openDashboard(page);
    await expect(dashboard.getByText(LOG_OFFICE_DAY)).toBeVisible();

    await dashboard.locator('app-dash-button ion-button').click();

    // The card reports the logged day by swapping its own label — the office-day
    // list is derived state, so this is the domain's own read-back.
    await expect(dashboard.getByText(OFFICE_DAY_LOGGED)).toBeVisible();
    await waitForPersisted(page, 'officeTime');

    await page.reload();

    await expect(dashboard.getByText(OFFICE_DAY_LOGGED)).toBeVisible({
      timeout: 30_000,
    });
  });

  test('reaches the settings page from the dashboard header', async ({
    page,
  }) => {
    const dashboard = await openDashboard(page);

    await dashboard.getByTestId('office-time-settings-link').click();

    await expect(page).toHaveURL(/#\/office-time\/settings$/);
    await expect(pageRoot(page, 'app-page-office-time-settings')).toBeVisible({
      timeout: 30_000,
    });
  });
});
