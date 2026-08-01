/**
 * Shared helpers for the trackplay e2e suite.
 *
 * The app is a zoneless Ionic/NgRx app that hydrates its slices from Ionic
 * Storage (IndexedDB) on boot. Playwright gives every test a fresh browser
 * context, so each test starts from an empty trackplay slice — no players and no
 * games, but the reducer seeds the 3 default game types (Standard / Rommé /
 * Skat) on `loadedSuccessfully`.
 *
 * Trackplay pages are top-level **hash routes** (`withHashLocation()`):
 *   /#/trackplay            games list (program home)
 *   /#/trackplay/players    players list
 *   /#/trackplay/player/:id single player
 *   /#/trackplay/game-types game types (Spielarten)
 *   /#/trackplay/game/:id   scoring grid
 *
 * The side menu duplicates the "Spiele" page title, so ALL content assertions
 * are scoped to `#main-content` (the routed-page container), never the menu.
 * Dialogs / toasts / select-alerts are Ionic overlays rendered at the app root
 * (outside `#main-content`) — scope those to their own component / element.
 */
import { expect, Locator, Page } from '@playwright/test';
// `mainContent`/`pageRoot` moved to the suite-wide helpers: every feature scopes
// to `#main-content`, not just trackplay. Re-exported so this suite's specs keep
// importing them from one place.
import { mainContent, openRowSwipe, pageRoot } from '../helpers';

export { mainContent, pageRoot };

/** The page-header "+" add button within a given page-component scope. */
export function addButton(scope: Locator): Locator {
  return scope.getByTestId('page-header-add');
}

/** Navigate to a trackplay hash route and wait for its routed page to attach. */
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

/**
 * The page-header title of ONE routed page. It takes the page scope rather than
 * the whole content area on purpose: every mounted page renders a title, so an
 * unscoped locator needed a `.first()` that could just as easily have read the
 * stale page's title as the one under test.
 */
export function headerTitle(scope: Locator): Locator {
  return scope.getByTestId('page-header-title');
}

/**
 * Create a player through the players-page add dialog. Assumes the players page
 * is the active route.
 */
export async function createPlayer(page: Page, name: string): Promise<void> {
  const players = pageRoot(page, 'app-page-trackplay-players');
  await addButton(players).click();
  const dialog = page.locator('app-trackplay-player-edit-modal');
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  const input = dialog.getByTestId('player-name-input').locator('input');
  await input.click();
  await input.fill(name);
  await dialog.getByRole('button', { name: 'OK' }).click();
  await expect(dialog).toBeHidden();
  await expect(players.getByText(name, { exact: true })).toBeVisible();
}

/**
 * Pick an option from an Ionic `ion-select` (default `alert` interface): open
 * the overlay, choose the radio by its label, confirm with the alert's OK.
 */
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

/** Toggle a player checkbox inside the game-edit dialog's player-select. */
export async function togglePlayerInSelect(
  dialog: Locator,
  name: string
): Promise<void> {
  const row = dialog.getByTestId('player-select-row').filter({ hasText: name });
  await row.getByTestId('player-select-checkbox').click();
}

/** Reveal a trackplay row's leading options and click the delete one. */
export async function slideDelete(row: Locator): Promise<void> {
  await openRowSwipe(row.locator('ion-item-sliding'), 'start');
  await row.getByTestId('row-delete').click();
}
