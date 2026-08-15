/* ─── why ─────────────────────────────────────────────────────────
 * A wiring guard for the lazy office-time context. Both pages hang off
 * one componentless subtree that spreads the bundle, so the slice
 * registers once and activation blocks on `moduleHydrationResolver(load,
 * loaded)` — drop the load effect and nothing errors, the resolver simply
 * waits forever and neither page paints.
 *
 * Seeing a CARD is a stronger signal than seeing the page: the dashboard
 * is a grid of `@defer (on viewport)` cards driven by
 * `visibleDashboardItems()`, which needs both `dashboardItems` and
 * `dashboardSettings` hydrated. The two asserted are the ones the default
 * order puts above the fold, which is what makes them reachable by the
 * viewport trigger at all.
 *
 * The logged day is read back off the card's own label rather than a
 * list, because the office-day list is derived state — this is the domain
 * reading its own write.
 *
 * It also asserts the persisted BYTES, which is the only statement here
 * that a device upgrading into the keyed `officedays` shape still reads
 * its own history: the store is a day-keyed map now, the document stayed
 * an array of `YYYY-MM-DD`, and nothing else in the suite would notice
 * the two parting company. The date is read IN the page — no `timezoneId`
 * is configured, so a UTC-derived date computed in the test process would
 * disagree with the browser's for a few hours every night. `sv-SE` is the
 * locale whose short date already IS `YYYY-MM-DD`.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import { pageRoot, waitForPersisted } from '../helpers';

const LOG_OFFICE_DAY = 'Bürotag erfassen';
const OFFICE_DAY_LOGGED = 'Bürotag erfasst.';

async function openDashboard(page: Page): Promise<Locator> {
  await page.goto('/#/office-time');
  const dashboard = pageRoot(page, 'app-page-office-time');
  await expect(dashboard).toBeVisible({ timeout: 30_000 });
  return dashboard;
}

test.describe('office-time (lazy)', () => {
  test('hydrates and paints the dashboard cards', async ({ page }) => {
    const dashboard = await openDashboard(page);

    await expect(dashboard.locator('app-dash-date')).toBeVisible({
      timeout: 30_000,
    });
    await expect(dashboard.locator('app-dash-button')).toBeVisible();
  });

  test('keeps a logged office day across a full reload', async ({ page }) => {
    const dashboard = await openDashboard(page);
    await expect(dashboard.getByText(LOG_OFFICE_DAY)).toBeVisible();

    await dashboard.locator('app-dash-button ion-button').click();

    await expect(dashboard.getByText(OFFICE_DAY_LOGGED)).toBeVisible();

    const today = await page.evaluate(() =>
      new Date().toLocaleDateString('sv-SE')
    );
    await waitForPersisted(page, 'officeTime', `"officedays":["${today}"]`);

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
