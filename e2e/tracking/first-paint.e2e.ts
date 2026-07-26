import { expect, test } from '@playwright/test';
import { addViaSearch, waitForListPage, waitForPersisted } from '../helpers';

/**
 * Wiring guard for the now-LAZY tracking context (lazy-modules §7).
 *
 * `/tracking` (and `/data`) register the `tracking` slice
 * via `trackingProviders` and block activation on
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

    await expect(page.locator('#main-content app-page-tracking')).toBeVisible({
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
    await waitForPersisted(page, 'tracking', 'Standup');

    await page.reload();
    await waitForListPage(page);

    await expect(content.getByText('Standup').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  /**
   * Drives the integrated edit dialog: tracking now opens the shared,
   * domain-blind `itemDialogs` slice (`showEditDialog(item, '_tracking')`) and
   * renders the shared pure-ui modal via `edit-tracking-item-dialog` — the same
   * flow grocery/tasks use, with tracking's own `dialogs` fork gone. The wrapper
   * guards on `listId === '_tracking'`, holds a local draft, and saves via
   * `TrackingActions.addOrUpdateItem`.
   */
  test('edits a tracking item through the shared edit dialog', async ({
    page,
  }) => {
    await page.goto('/#/tracking');
    await waitForListPage(page);

    await addViaSearch(page, 'Standup');
    const content = page.locator('#main-content');
    await expect(content.getByText('Standup').first()).toBeVisible({
      timeout: 10_000,
    });

    // Open the item's kebab menu → "Bearbeiten" (dispatches the shared
    // ItemDialogsActions.showEditDialog onto the eager itemDialogs slice).
    await content
      .locator('app-tracking-item ion-button[id^="kebab-"]')
      .first()
      .click();
    await page.locator('ion-popover').getByText('Bearbeiten').click();

    // The shared modal opens; rename via its local draft and save.
    const nameField = page.getByRole('textbox', { name: 'Name' });
    await expect(nameField).toBeVisible({ timeout: 10_000 });
    await nameField.fill('Retro');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(content.getByText('Retro').first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(content.getByText('Standup')).toHaveCount(0);
  });

  /**
   * Guards the tracking-specific chrome the shared, domain-blind
   * `ListPageComponent` renders through projection (the retire-the-fork
   * refactor): the reset/save toolbar buttons projected into
   * `[toolbarActionsEnd]`, the daily-sessions panel in `[searchExtras]`, and the
   * settings link double-projected through `[headerEnd]` into the page-header
   * toolbar. It also proves the category UI is suppressed (`[hasCategories]`
   * false) so tracking renders a plain list — a naive swap would have silently
   * dropped the first two and wrongly shown the last.
   */
  test('renders the projected chrome and suppresses the category UI', async ({
    page,
  }) => {
    await page.goto('/#/tracking');
    await waitForListPage(page);

    const trackingPage = page.locator('#main-content app-page-tracking');

    // [searchExtras] slot — the daily-sessions panel.
    await expect(trackingPage.locator('app-daily-sessions')).toBeVisible();

    // [toolbarActionsEnd] slot — reset-all + save-and-reset buttons.
    await expect(trackingPage.getByText('Verwerfen')).toBeVisible();
    await expect(trackingPage.getByText('Speichern')).toBeVisible();

    // Category UI suppressed: no quick-add row on the tracking list.
    await expect(trackingPage.locator('app-item-list-quick-add')).toHaveCount(
      0
    );

    // [headerEnd] slot double-projected into the page-header toolbar — the
    // settings link must keep its routerLink and reach the tracking data view.
    await trackingPage
      .locator('ion-button', {
        has: page.locator('ion-icon[icon="settings-sharp"]'),
      })
      .click();
    await expect(page).toHaveURL(/#\/data$/);
  });
});
