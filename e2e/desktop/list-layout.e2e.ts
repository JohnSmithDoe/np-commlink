/* ─── why ─────────────────────────────────────────────────────────
 * The two desktop layout facts that were wrong before theme/_layout.scss
 * and that CSS alone cannot keep honest.
 *
 * The shared edge: `--app-content-max-width` is capped on
 * `ion-content > *` — every child, INDEPENDENTLY — and the header's rows
 * cap themselves. So the searchbar, the sort toolbar and the list agree
 * only as long as all three read the same property, and nothing in the
 * type system says they do. The searchbar used to take 420px hard-right
 * and disagreed with both.
 *
 * The second column: the grid is a media query above `layout.$wide`
 * (1024px), and `desktop-chromium` is the only project wide enough to
 * enter it — Playwright's Desktop Chrome default is 1280×720, and
 * `e2e/desktop/**` is the only path it matches. On the Pixel 5 the rest of
 * the suite emulates, both assertions here would be vacuously true.
 *
 * Rows are compared by their bounding box rather than by counting
 * columns: `repeat(auto-fit, …)` has no DOM signal at all, and "these two
 * items share a row" is the actual claim.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import {
  addViaSearch,
  listRow,
  searchInput,
  waitForListPage,
} from '../helpers';

async function leftEdge(page: Page, selector: string): Promise<number> {
  const box = await page.locator(`${selector}:visible`).first().boundingBox();
  expect(box).not.toBeNull();
  return Math.round(box!.x);
}

test.describe('desktop list layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/household/storage/_storage');
    await waitForListPage(page);
  });

  test('header rows and the list share one left edge', async ({ page }) => {
    await addViaSearch(page, 'Milk');
    await expect(listRow(page, /Milk/)).toBeVisible({ timeout: 10_000 });

    const searchbar = await leftEdge(page, 'app-item-list-searchbar');
    const toolbar = await leftEdge(page, 'app-item-list-toolbar');
    const list = await leftEdge(page, 'app-item-list');

    expect(Math.abs(searchbar - toolbar)).toBeLessThanOrEqual(1);
    expect(Math.abs(searchbar - list)).toBeLessThanOrEqual(1);
  });

  test('the list flows into columns', async ({ page }) => {
    for (const name of ['Milk', 'Bread', 'Eggs']) {
      await addViaSearch(page, name);
      await expect(listRow(page, new RegExp(name))).toBeVisible({
        timeout: 10_000,
      });
    }
    await searchInput(page).fill('');

    const tops = await page
      .getByTestId('list-row')
      .evaluateAll((rows) =>
        rows.map((row) => Math.round(row.getBoundingClientRect().top))
      );

    expect(new Set(tops).size).toBeLessThan(tops.length);
  });
});
