/* ─── why ─────────────────────────────────────────────────────────
 * The catalog was the one household list with no e2e at all, and the list
 * flow is now three separate `createItemListEffects` registrations rather
 * than one hand-rolled fan-out — so "products is wired to its own slice"
 * stopped being implied by shopping and storage passing.
 *
 * It has to be an e2e and not a spec. The household-categories bug is the
 * precedent: every unit test there passed against a version the context
 * never registered, because a spec invokes the effect itself while only a
 * running app proves the provider list mentions it. `addViaSearch` goes
 * through `addItemFromSearch` → the effect → `addItem`, so a row that
 * appears is proof the registration is live.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import {
  addViaSearch,
  gotoFeature,
  listRow,
  ROUTE,
  searchInput,
} from '../helpers';

test.describe('products catalog', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFeature(page, ROUTE.products);
  });

  test('adds a product through the searchbar', async ({ page }) => {
    await addViaSearch(page, 'Olive oil');
    await expect(listRow(page, /Olive oil/)).toBeVisible({ timeout: 10_000 });
  });

  test('clears the search once the product lands', async ({ page }) => {
    await addViaSearch(page, 'Olive oil');
    await expect(listRow(page, /Olive oil/)).toBeVisible({ timeout: 10_000 });

    await expect(searchInput(page)).toHaveValue('', { timeout: 10_000 });
  });
});
