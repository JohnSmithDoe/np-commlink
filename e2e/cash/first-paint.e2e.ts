import { expect, test } from '@playwright/test';

/**
 * Wiring guard for the LAZY cash context (lazy-modules Phase D).
 *
 * The /cash route registers the cash slice + effects via its route `providers`
 * (provide-cash-lazy.ts) and blocks activation on
 * `moduleHydrationResolver(CashActions.load, CashActions.loaded)`. If the load
 * effect (CashLoadEffects) were dropped from those providers — the exact
 * regression the Phase-D review flagged — the resolver would await
 * `[Cash] loaded` forever, the route would never activate, and the page would
 * never paint. Asserting the scaffold renders its hydrated account count proves
 * provideState + CashLoadEffects + the resolver are all wired end to end.
 *
 * NB: cash is a P0 read-only scaffold (no add-transaction UI yet), so this can
 * only exercise the load/hydrate wiring. A full mutate → reload persistence
 * guard (parity with the trackplay/tasks reload e2e, covering CashSaveEffects)
 * is still outstanding now that the ledger UI has landed — see docs/open-tasks.md.
 */
test.describe('cash first paint', () => {
  test('hydrates and paints the CREDSTICK scaffold', async ({ page }) => {
    await page.goto('/#/cash');

    const scaffold = page.locator('#main-content app-page-cash');
    await expect(scaffold).toBeVisible({ timeout: 30_000 });

    // Fresh browser context → empty ledger hydrates to zero accounts. Seeing the
    // net-worth header plus the "no accounts" empty state means the resolver
    // resolved (the load effect emitted `loaded`) and the page painted its
    // hydrated content — the `@else` empty branch only renders once `accounts()`
    // has hydrated to an empty array.
    await expect(scaffold.locator('.cash-networth__value')).toBeVisible();
    await expect(scaffold.locator('.cash-empty')).toBeVisible();
  });
});
