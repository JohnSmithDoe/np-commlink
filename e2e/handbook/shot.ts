/* ─── why ─────────────────────────────────────────────────────────
 * Handbook screenshots need the opposite of what a spec needs: a deck with
 * every program switched on, a settled animation, and a file on disk rather
 * than an assertion. `bootDeck` reads each toggle's own `checked` property
 * instead of counting rows, so it is idempotent and survives a catalog that
 * grows. Shots land OUTSIDE the repo — binaries in a doc tree rot faster
 * than the doc does.
 * ───────────────────────────────────────────────────────────────── */
import { expect, Locator, Page } from '@playwright/test';
import { waitForPersisted } from '../helpers';

const SHOT_DIR = './test-results/handbook-shots';

const SETTLE_MS = 500;

export async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(SETTLE_MS);
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png` });
}

export async function shotOf(target: Locator, name: string): Promise<void> {
  await target.page().waitForTimeout(SETTLE_MS);
  await target.screenshot({ path: `${SHOT_DIR}/${name}.png` });
}

export async function bootDeck(page: Page): Promise<void> {
  await page.goto('/#/commlink/deck');
  const toggles = page.getByTestId('deck-config-row-toggle');
  await expect(toggles.first()).toBeVisible({ timeout: 60_000 });

  for (const toggle of await toggles.all()) {
    const on = await toggle.evaluate(
      (element: HTMLElement & { checked: boolean }) => element.checked
    );
    if (!on) await toggle.click();
  }
  await waitForPersisted(page, 'deck');
}

export async function openPage(
  page: Page,
  route: string,
  pageSelector: string
): Promise<Locator> {
  await page.goto(`/#/${route}`);
  const root = page.locator('#main-content').locator(pageSelector);
  await expect(root).toBeVisible({ timeout: 60_000 });
  return root;
}
