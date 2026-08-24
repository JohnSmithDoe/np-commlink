/* ─── why ─────────────────────────────────────────────────────────
 * Only observable past 992px, so `desktop-chromium` is the only project
 * that can see it — on the Pixel 5 both claims would be vacuous.
 *
 * The assertions hang off the menu's own chrome, not off program rows: a
 * cold deck ships EMPTY, so a fresh context has no `menu-row` at all.
 *
 * The shortcut is asserted because Ionic hides an `ion-menu-toggle` whose
 * menu sits in a visible pane — documented behaviour, whose documented
 * override is `autoHide=false`. Without it the open pane is a dead column,
 * and nothing else in the app would notice the flag's loss.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';

const menuTitle = (page: Page): Locator => page.locator('ion-menu ion-title');
const menuShortcut = (page: Page): Locator =>
  page.locator('ion-menu ion-menu-toggle ion-button').first();
const menuButton = (page: Page): Locator =>
  page.locator('ion-menu-button:visible');

test.describe('the desktop side menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/settings');
    await expect(menuTitle(page)).toBeVisible({ timeout: 30_000 });
  });

  test('stands open on its own, and the page drops its menu button', async ({
    page,
  }) => {
    await expect(menuShortcut(page)).toBeVisible();
    await expect(menuButton(page)).toHaveCount(0);
  });

  test('collapses again below the breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 });

    await expect(menuButton(page).first()).toBeVisible();
    await expect(menuTitle(page)).toBeHidden();
  });
});
