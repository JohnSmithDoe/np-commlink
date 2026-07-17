import { expect, test } from '@playwright/test';
import { addViaSearch, waitForListPage } from '../helpers';

/**
 * Acceptance for notifications-lazy (lazy-modules §7).
 *
 * notifications is no longer eager — its slice registers only on the
 * /notifications route. Tracking (running on /tracking) writes notifications
 * through the DURABLE NotificationsStore (read-modify-write on npc-notifications),
 * NOT by dispatching into the — unregistered — reducer. This proves that path
 * end to end: toggle a tracker to create a tracking-state notification with
 * /notifications NEVER visited this session, then open /notifications for the
 * first time; only the persisted doc (written durably by tracking) could carry
 * it, and the route resolver hydrates the slice from it.
 */
test.describe('notifications (lazy) — durable cross-module write', () => {
  test('a tracker toggled on /tracking surfaces on /notifications', async ({
    page,
  }) => {
    await page.goto('/#/tracking');
    await waitForListPage(page);
    await addViaSearch(page, 'Meeting');

    // Toggle the item → running → reconcileState$ writes a tracking-state
    // notification to the durable npc-notifications doc.
    const item = page
      .locator('#main-content app-tracking-item')
      .filter({ hasText: 'Meeting' });
    await expect(item).toBeVisible({ timeout: 10_000 });
    await item.getByText('Meeting').first().click();
    await page.waitForTimeout(400); // let the durable write flush to storage

    // First-ever visit to /notifications this session → the resolver hydrates
    // the slice from the durable doc → the tracking notification is present.
    await page.goto('/#/notifications');
    const content = page.locator('#main-content app-page-notifications');
    await expect(content).toBeVisible({ timeout: 30_000 });
    await expect(content.getByText(/Meeting/).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
