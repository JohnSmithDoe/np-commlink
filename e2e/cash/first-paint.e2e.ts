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
 * must be added when the P1 ledger UI lands — see docs/todo.md.
 */
test.describe('cash first paint', () => {
  test('hydrates and paints the CREDSTICK scaffold', async ({ page }) => {
    await page.goto('/#/cash');

    const scaffold = page.locator('#main-content app-page-cash');
    await expect(scaffold).toBeVisible({ timeout: 30_000 });

    // Fresh browser context → empty ledger hydrates to 0 accounts. Seeing the
    // count at all means the resolver resolved (load effect emitted `loaded`).
    await expect(scaffold.locator('.cash-scaffold__count')).toHaveText('0');
  });
});
