/* ─── why ─────────────────────────────────────────────────────────
 * Tracking is lazy, so the first two tests are the standard wiring +
 * data-loss pair: activation blocks on `moduleHydrationResolver(load,
 * loaded)`, and on reload the route re-registers the slice at empty
 * `initialState` and dispatches `[Tracking] load` — which the save effect
 * must exclude, or it writes that empty slice over the saved item first.
 *
 * The dialog test proves the open path has no action bus left in it: the
 * kebab calls `ItemDialogService.open()` straight from the facade. The
 * `ion-popover` it opens through is unambiguous even though every row
 * declares one, because an `ng-template` inside `ion-popover` is not
 * rendered until presented — the other rows' copies are not in the DOM at
 * all.
 *
 * The last test is the one no unit spec could replace: tracking's own
 * chrome reaches the screen only through the shared, domain-blind list
 * page's projection slots — the daily-sessions panel via
 * `[afterList]`, the reset/save buttons via `[toolbarActionsEnd]`, and
 * the settings link DOUBLE-projected through `[headerEnd]` into the page
 * header, which is why that assertion follows the link rather than merely
 * finding it. It also asserts the category UI is absent, since tracking's
 * facade omits `manageCategories`. A naive swap onto the shared page
 * would have silently dropped the first three and wrongly shown the last.
 *
 * `trackingRow` matches the row element rather than its text, which is
 * what drops the `.first()` a text locator forces — that matches every
 * ancestor containing the name too.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { Locator } from '@playwright/test';
import {
  addViaSearch,
  mainContent,
  pageRoot,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

const trackingRow = (content: Locator, name: string): Locator =>
  content.locator('app-tracking-item').filter({ hasText: name });

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

    await trackingRow(content, 'Standup')
      .getByTestId('tracking-item-kebab')
      .click();
    await page.locator('ion-popover').getByTestId('kebab-edit').click();

    const nameField = page.getByRole('textbox', { name: 'Name' });
    await expect(nameField).toBeVisible({ timeout: 10_000 });
    await nameField.fill('Retro');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(trackingRow(content, 'Retro')).toBeVisible({
      timeout: 10_000,
    });
    await expect(content.getByText('Standup')).toHaveCount(0);
  });

  test('renders the projected chrome and suppresses the category UI', async ({
    page,
  }) => {
    await page.goto('/#/tracking');
    await waitForListPage(page);

    const trackingPage = pageRoot(page, 'app-page-tracking');

    await expect(trackingPage.locator('app-daily-sessions')).toBeVisible();

    await expect(trackingPage.getByText('Verwerfen')).toBeVisible();
    await expect(trackingPage.getByText('Speichern')).toBeVisible();

    await expect(trackingPage.locator('app-item-list-quick-add')).toHaveCount(
      0
    );

    await trackingPage.getByTestId('tracking-daily-view-link').click();
    await expect(page).toHaveURL(/#\/data$/);
  });
});
