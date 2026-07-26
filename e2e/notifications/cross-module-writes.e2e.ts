import { expect, test } from '@playwright/test';
import { addViaSearch, waitForListPage, waitForPersisted } from '../helpers';

/**
 * Acceptance for the notifications inbox as an eager fan-in sink.
 *
 * Tracking projects its item states into the inbox from /tracking by dispatching
 * the published contract; the inbox reducer receives it because it is eager, and
 * the inbox's own save effect persists it. This proves the path end to end with
 * /notifications NEVER visited this session: toggle a tracker, then open
 * /notifications for the first time and find the notification there.
 */
test.describe('notifications — cross-module write from another route', () => {
  test('a tracker toggled on /tracking surfaces on /notifications', async ({
    page,
  }) => {
    await page.goto('/#/tracking');
    await waitForListPage(page);
    await addViaSearch(page, 'Meeting');

    // Toggle the item → running → reconcileState$ publishes a tracking-state
    // notification, which the inbox's save effect writes to npc-notifications.
    const item = page
      .locator('#main-content app-tracking-item')
      .filter({ hasText: 'Meeting' });
    await expect(item).toBeVisible({ timeout: 10_000 });
    await item.getByText('Meeting').first().click();
    await waitForPersisted(page, 'notifications');

    // First-ever visit to /notifications this session — the page is lazy, the
    // slice is not, so what tracking published is already in it.
    await page.goto('/#/notifications');
    const content = page.locator('#main-content app-page-notifications');
    await expect(content).toBeVisible({ timeout: 30_000 });
    await expect(content.getByText(/Meeting/).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
