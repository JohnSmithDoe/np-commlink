/* ─── why ─────────────────────────────────────────────────────────
 * A wiring guard for the lazy cash context. Its route registers the slice
 * through `providers` and blocks activation on
 * `moduleHydrationResolver(load, loaded)`, so dropping the load effect
 * from that bundle fails silently: the resolver simply awaits `[Cash]
 * loaded` forever and the page never paints.
 *
 * An empty ledger is enough to prove it, because the empty state is
 * reachable only THROUGH hydration — the `@else` branch renders once
 * `accounts()` is an empty array, not while it is absent. That is what
 * makes "no accounts" and "never hydrated" distinguishable on screen.
 *
 * The write half — mutate, reload, read back, i.e. the save effect — is
 * deliberately elsewhere, in `persistence.e2e.ts`.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { pageRoot } from '../helpers';

test.describe('cash first paint', () => {
  test('hydrates and paints the CREDSTICK scaffold', async ({ page }) => {
    await page.goto('/#/cash');

    const scaffold = pageRoot(page, 'app-page-cash');
    await expect(scaffold).toBeVisible({ timeout: 30_000 });

    await expect(scaffold.getByTestId('cash-networth')).toBeVisible();
    await expect(
      scaffold.locator('app-item-list-empty app-text-item')
    ).toBeVisible();
  });
});
