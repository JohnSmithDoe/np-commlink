/* ─── why ─────────────────────────────────────────────────────────
 * One case per list route, because the four are independent mounts of one
 * domain-blind page. What is under test is the router-store ×
 * hash-routing × zoneless change-detection pipeline resolving a
 * `:listId`, not the list component, which the unit specs already cover.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { addViaSearch, listRow, ROUTE, waitForListPage } from '../helpers';

const CASES: { route: (typeof ROUTE)[keyof typeof ROUTE]; item: string }[] = [
  { route: ROUTE.shopping, item: 'Milk' },
  { route: ROUTE.storage, item: 'Rice' },
  { route: ROUTE.tasks, item: 'Sweep' },
  { route: ROUTE.products, item: 'Sugar' },
];

test.describe('household first paint', () => {
  for (const { route, item } of CASES) {
    test(`renders the first item on /#/${route}`, async ({ page }) => {
      await page.goto(`/#/${route}`);
      await waitForListPage(page);

      await addViaSearch(page, item);
      await expect(listRow(page, new RegExp(item))).toBeVisible({
        timeout: 10_000,
      });
    });
  }
});
