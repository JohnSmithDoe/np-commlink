import { expect, test } from '@playwright/test';
import {
  addViaSearch,
  pageRoot,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

/**
 * Acceptance for the notification CTA round-trip, which is a *route* contract
 * rather than an import: the inbox deep-links `/tracking?cmd=<command>&target=
 * <itemId>` with the command it already holds, and tracking resolves it against
 * its own items — it cannot read the inbox back. Two halves that unit tests can
 * only check separately, so the URL between them is what this covers.
 */
test.describe('notifications — CTA deep-link back into a producer', () => {
  test('tapping "Pausieren" pauses the tracker and re-projects the row', async ({
    page,
  }) => {
    await page.goto('/#/tracking');
    await waitForListPage(page);
    await addViaSearch(page, 'Meeting');

    const item = page
      .locator('#main-content app-tracking-item')
      .filter({ hasText: 'Meeting' });
    await expect(item).toBeVisible({ timeout: 10_000 });
    await item.click();
    await waitForPersisted(page, 'notifications', 'Meeting');

    await page.goto('/#/notifications');
    const inbox = pageRoot(page, 'app-page-notifications');
    const row = inbox
      .getByTestId('notification-row')
      .filter({ hasText: 'Meeting' });
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row).toContainText('Läuft');

    await row.getByRole('button', { name: 'Pausieren' }).click();

    // The link lands on /tracking, which applies the command and strips the
    // params so a reload cannot re-fire the toggle.
    await expect(page).toHaveURL(/#\/tracking$/);
    await waitForPersisted(page, 'notifications', 'pausiert');

    await page.goto('/#/notifications');
    await expect(row).toContainText('Pausiert');
    await expect(row.getByRole('button', { name: 'Starten' })).toBeVisible();
  });
});
