/* ─── why ─────────────────────────────────────────────────────────
 * Handbook screenshots need the opposite of what a spec needs: a deck with
 * every program switched on, a settled animation, and a file on disk rather
 * than an assertion. `bootDeck` reads each toggle's own `checked` property
 * instead of counting rows, so it is idempotent and survives a catalog that
 * grows.
 *
 * It switches MODULES on before rows because the programs lens nests a
 * multi-program module in a collapsed accordion: its row toggles are in the
 * DOM but not visible, and a module toggle turns the whole group on without
 * expanding anything. The row pass then catches the single-program modules,
 * which render no accordion at all.
 *
 * Shots land OUTSIDE the repo — binaries in a doc tree rot faster
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

async function switchOn(toggles: Locator): Promise<void> {
  for (let index = 0; index < (await toggles.count()); index++) {
    const toggle = toggles.nth(index);
    if (!(await toggle.isVisible())) continue;
    const on = await toggle.evaluate(
      (element: HTMLElement & { checked: boolean }) => element.checked
    );
    if (!on) await toggle.click();
  }
}

export async function bootDeck(page: Page): Promise<void> {
  await page.goto('/#/commlink/deck');
  await expect(page.getByTestId('deck-config-lens')).toBeVisible({
    timeout: 60_000,
  });

  await switchOn(page.getByTestId('deck-config-module-toggle'));
  await switchOn(page.getByTestId('deck-config-row-toggle'));
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
