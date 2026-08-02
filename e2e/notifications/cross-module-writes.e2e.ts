/* ─── why ─────────────────────────────────────────────────────────
 * The inbox is an EAGER fan-in sink, and the shape of the spec is the
 * proof: /notifications is not visited until the last step, so everything
 * the row contains was written while only /tracking was mounted. Tracking
 * dispatches the published contract, the eager reducer receives it, the
 * inbox's own save effect persists it — and the producer never learns
 * that notifications are persisted at all.
 *
 * Page laziness and slice lifecycle are independent axes, which is what
 * that first-ever visit demonstrates: the page loads cold, the slice does
 * not.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import {
  addViaSearch,
  pageRoot,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

test.describe('notifications — cross-module write from another route', () => {
  test('a tracker toggled on /tracking surfaces on /notifications', async ({
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
    await waitForPersisted(page, 'notifications');

    await page.goto('/#/notifications');
    const content = pageRoot(page, 'app-page-notifications');
    await expect(content).toBeVisible({ timeout: 30_000 });
    await expect(
      content.getByTestId('notification-row').filter({ hasText: 'Meeting' })
    ).toBeVisible({ timeout: 10_000 });
  });
});
