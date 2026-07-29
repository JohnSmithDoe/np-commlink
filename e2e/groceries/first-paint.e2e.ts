import { expect, test } from '@playwright/test';
import { addViaSearch, listRow, ROUTE, waitForListPage } from '../helpers';

/**
 * Smoke test that every grocery list route paints its list page and can render
 * a freshly-added item end-to-end — exercising the router-store × hash-routing
 * × zoneless change-detection pipeline for each independent feature.
 */
const CASES: { route: (typeof ROUTE)[keyof typeof ROUTE]; item: string }[] = [
  { route: ROUTE.shopping, item: 'Milk' },
  { route: ROUTE.storage, item: 'Rice' },
  { route: ROUTE.tasks, item: 'Sweep' },
  { route: ROUTE.products, item: 'Sugar' },
];

test.describe('grocery first paint', () => {
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
