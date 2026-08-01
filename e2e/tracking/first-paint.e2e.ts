import { expect, test } from '@playwright/test';
import { Locator } from '@playwright/test';
import {
  addViaSearch,
  mainContent,
  pageRoot,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

/**
 * The tracking row whose name matches. `app-tracking-item` is the row's own
 * component selector — already a contract — so this needs no id of its own;
 * matching the row rather than the text is what drops the `.first()` a regex/text
 * locator forced (it matches every ancestor containing the name too).
 */
const trackingRow = (content: Locator, name: string): Locator =>
  content.locator('app-tracking-item').filter({ hasText: name });

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

    await expect(pageRoot(page, 'app-page-tracking')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('keeps a tracked item across a full reload', async ({ page }) => {
    await page.goto('/#/tracking');
    await waitForListPage(page);

    await addViaSearch(page, 'Standup');
    const content = mainContent(page);
    await expect(trackingRow(content, 'Standup')).toBeVisible({
      timeout: 10_000,
    });
    await waitForPersisted(page, 'tracking', 'Standup');

    await page.reload();
    await waitForListPage(page);

    await expect(trackingRow(content, 'Standup')).toBeVisible({
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
    const content = mainContent(page);
    await expect(trackingRow(content, 'Standup')).toBeVisible({
      timeout: 10_000,
    });

    // Open the item's kebab menu → edit, which calls ItemDialogService.open()
    // straight from the facade (there is no dialogs slice any more).
    //
    // Still scoped to `ion-popover`, which is the documented overlay case: a
    // presented popover teleports to the app root, so the row cannot scope it.
    // Only *one* is ever matchable — an `ng-template` inside `ion-popover` is not
    // rendered until it is presented, so the other rows' copies are not in the
    // DOM at all.
    await trackingRow(content, 'Standup')
      .getByTestId('tracking-item-kebab')
      .click();
    await page.locator('ion-popover').getByTestId('kebab-edit').click();

    // The shared modal opens; rename via its local draft and save.
    const nameField = page.getByRole('textbox', { name: 'Name' });
    await expect(nameField).toBeVisible({ timeout: 10_000 });
    await nameField.fill('Retro');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(trackingRow(content, 'Retro')).toBeVisible({
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
   * toolbar. It also proves the category UI is suppressed (the facade omits
   * `manageCategories`) so tracking renders a plain list — a naive swap would
   * have silently dropped the first two and wrongly shown the last.
   */
  test('renders the projected chrome and suppresses the category UI', async ({
    page,
  }) => {
    await page.goto('/#/tracking');
    await waitForListPage(page);

    const trackingPage = pageRoot(page, 'app-page-tracking');

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
    await trackingPage.getByTestId('tracking-daily-view-link').click();
    await expect(page).toHaveURL(/#\/data$/);
  });
});
