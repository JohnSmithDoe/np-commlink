/* ─── why ─────────────────────────────────────────────────────────
 * The two desktop layout facts that CSS alone cannot keep honest, both
 * only observable on a wide viewport: `desktop-chromium` is the only
 * project wide enough (Playwright's Desktop Chrome default is 1280×720)
 * and `e2e/desktop/**` the only path it matches, so on the Pixel 5 the
 * rest of the suite emulates, both assertions would be vacuously true.
 *
 * The shared edge: `--app-content-max-width` is capped on
 * `ion-content > *` — every child, INDEPENDENTLY — and the header's rows
 * cap themselves. So the searchbar, the sort toolbar and the list agree
 * only as long as all three read the same property, and nothing in the
 * type system says they do. The searchbar used to take 420px hard-right
 * and disagreed with both.
 *
 * One row per line: a multi-column list was tried and reverted
 * (decisions.md), and the CSS that did it was one `@include layout.wide`
 * away from returning. Rows are compared by bounding box because an
 * auto-fit grid has no DOM signal at all — "no two items share a row" is
 * the actual claim, and it is the inverse of what this spec asserted
 * while the grid existed.
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
    await page.goto('/#/household/storage');
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

  test('every row takes a full line, however many there are', async ({
    page,
  }) => {
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

    expect(tops.length).toBe(3);
    expect(new Set(tops).size).toBe(tops.length);
  });
});
