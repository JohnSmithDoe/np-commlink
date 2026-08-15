/* ─── why ─────────────────────────────────────────────────────────
 * A fresh browser context starts trackplay with no players and no games,
 * but NOT with no game types: the reducer seeds Standard, Rommé and Skat
 * on `loaded`, so a spec may pick one without creating it.
 *
 * `mainContent`/`pageRoot` are re-exported rather than defined here.
 * Every feature scopes to `#main-content`, not just trackplay, so they
 * moved out to the suite-wide helpers while this suite's specs keep one
 * import.
 *
 * `headerTitle` takes a page scope rather than the whole content area:
 * every mounted page renders a title, so the unscoped locator needed a
 * `.first()` that could just as easily read the stale page's.
 *
 * `pickSelectOption` clicks the locator it is handed, so a caller must
 * pass the `ion-select` HOST — its shadow `part="inner"` swallows a click
 * aimed at the accessible button. It drives the default `alert`
 * interface, which needs its own OK; a popover-interface select confirms
 * on the tap instead.
 *
 * `createPlayer` assumes the players page is the active route.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page } from '@playwright/test';
import { mainContent, pageRoot, presentedDialog } from '../helpers';

export { mainContent, pageRoot };

export const CREATE_BUTTON = 'Anlegen';

export function createDialog(page: Page): Locator {
  return presentedDialog(page, 'Neuen Eintrag anlegen');
}

export function nameBox(dialog: Locator): Locator {
  return dialog.getByPlaceholder('Gib einen Namen ein');
}

export function addButton(scope: Locator): Locator {
  return scope.getByTestId('page-header-add');
}

export async function gotoTrackplay(
  page: Page,
  path: string,
  pageSelector: string
): Promise<void> {
  await page.goto(`/#/${path}`);
  await expect(mainContent(page).locator(pageSelector)).toBeVisible({
    timeout: 30_000,
  });
}

export function headerTitle(scope: Locator): Locator {
  return scope.getByTestId('page-header-title');
}

export async function createPlayer(page: Page, name: string): Promise<void> {
  const players = pageRoot(page, 'app-page-trackplay-players');
  await addButton(players).click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await nameBox(dialog).fill(name);
  await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
  await expect(dialog).toBeHidden();
  await expect(players.getByText(name, { exact: true })).toBeVisible();
}

export async function pickSelectOption(
  page: Page,
  select: Locator,
  optionLabel: string
): Promise<void> {
  await select.click();
  const alert = page.locator('ion-alert');
  await expect(alert).toBeVisible({ timeout: 15_000 });
  await alert.getByRole('radio', { name: optionLabel }).click();
  await alert.getByRole('button', { name: 'OK' }).click();
  await expect(alert).toBeHidden();
}

export async function togglePlayerInSelect(
  dialog: Locator,
  name: string
): Promise<void> {
  const row = dialog.getByTestId('player-select-row').filter({ hasText: name });
  await row.getByTestId('player-select-checkbox').click();
}
