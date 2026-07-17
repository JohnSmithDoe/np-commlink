import { expect, test } from '@playwright/test';
import { addViaSearch, waitForListPage } from '../helpers';

/**
 * Wiring guard for the now-LAZY tracking context (lazy-modules §7).
 *
 * `/tracking` (and `/data/:listId`) register the `tracking` + `dialogs` slices
 * via `trackingLazyProviders` and block activation on
 * `moduleHydrationResolver(TrackingActions.load, .loaded)`. If the load effect
 * were dropped from those providers, or the resolver mis-wired, the route would
 * never activate and the page would never paint.
 *
 * The reload test additionally proves the lazy load/save round-trip
 * (TrackingLoadEffects ⟷ TrackingSaveEffects) and that the route's
 * `[Tracking] load` is excluded from the save filter — otherwise re-registering
 * the slice at empty initialState on reload would clobber the saved item before
 * the load effect reads it back (the data-loss bug that bit [Tasks]/[Cash]).
 */
test.describe('tracking (lazy)', () => {
  test('paints the tracking page on entry', async ({ page }) => {
    await page.goto('/#/tracking');
    await waitForListPage(page);

    await expect(page.locator('#main-content app-tracking-page')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('keeps a tracked item across a full reload', async ({ page }) => {
    await page.goto('/#/tracking');
    await waitForListPage(page);

    await addViaSearch(page, 'Standup');
    const content = page.locator('#main-content');
    await expect(content.getByText('Standup').first()).toBeVisible({
      timeout: 10_000,
    });
    await page.waitForTimeout(300); // let the fire-and-forget disk write flush

    await page.reload();
    await waitForListPage(page);

    await expect(content.getByText('Standup').first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
