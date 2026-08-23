/* ─── why ─────────────────────────────────────────────────────────
 * The desktop layout facts that CSS alone cannot keep honest, all only
 * observable on a wide viewport: `desktop-chromium` is the only project
 * wide enough (Playwright's Desktop Chrome default is 1280×720) and
 * `e2e/desktop/**` the only path it matches, so on the Pixel 5 the rest
 * of the suite emulates, every assertion here would be vacuously true.
 *
 * The second describe runs on SETTINGS, not on a list, and the viewport
 * is the reason: a list page caps at $content-wide, which IS 1280, so
 * its gutters are 0 and an alignment claim proves nothing. Settings caps
 * at $content-default, leaving 190px a side for a misalignment to show
 * in. Both facts there fail only past the cap — the centring is defeated
 * by CSS Ionic injects at runtime, and the header's controls answer to
 * --padding-* props no other page style touches. The header claim is
 * anchored on the CAP rather than on the list because the two break
 * together, and any header at all satisfies a flush-left list.
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

import { expect, Locator, Page, test } from '@playwright/test';
import {
  addViaSearch,
  listRow,
  searchInput,
  waitForListPage,
} from '../helpers';

function settingsList(page: Page): Locator {
  return page.locator('ion-content > ion-list').first();
}

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

const CAPS_APART = ['household/storage', 'settings', 'ritual'] as const;

test.describe('desktop page chrome', () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test('a hand-rolled list centres, like the rows it stands in for', async ({
    page,
  }) => {
    await page.goto('/#/settings');
    await expect(settingsList(page)).toBeVisible({ timeout: 30_000 });

    const box = await settingsList(page).boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    const left = box!.x;
    const right = viewport!.width - (box!.x + box!.width);

    expect(left).toBeGreaterThan(0);
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1);
  });

  test('the menu button holds one position across every cap', async ({
    page,
  }) => {
    const seen: number[] = [];

    for (const route of CAPS_APART) {
      await page.goto(`/#/${route}`);
      await page.reload();
      const menu = page.locator('ion-menu-button:visible').first();
      await expect(menu).toBeVisible({ timeout: 30_000 });
      const box = await menu.boundingBox();
      expect(box).not.toBeNull();
      seen.push(Math.round(box!.x));
    }

    expect(Math.max(...seen) - Math.min(...seen)).toBeLessThanOrEqual(1);
    expect(Math.min(...seen)).toBeGreaterThan(0);
  });
});
