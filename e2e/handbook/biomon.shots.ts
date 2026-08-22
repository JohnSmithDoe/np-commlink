/* ─── why ─────────────────────────────────────────────────────────
 * Handbook shots for BIOMON and TRACKPLAY. Both pages need DEEP state —
 * a weight curve needs five back-dated readings, a scoring grid needs
 * three rounds — so each test seeds through the real UI and reloads
 * before any swipe shot: Ionic keeps the departed page mounted, and a
 * reload is the only way to get exactly one `list-row` per row.
 *
 * A field typed into is blurred before its shot. Ionic's scroll-assist
 * parks the focused input off-screen behind a visual clone, so a shot
 * taken while it still has focus photographs an EMPTY field holding the
 * value the assertion just read back.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  CREATE_BUTTON,
  addButton,
  createDialog,
  editDialog,
  nameBox,
  openRowSwipe,
  pageRoot,
  pickSelectOption,
  waitForPersisted,
} from '../helpers';
import { bootDeck, openPage, shot } from './shot';

const PROFILES_PAGE = 'app-page-vitals-profiles';
const PROFILE_PAGE = 'app-page-vitals-profile';
const PILLS_PAGE = 'app-page-vitals-pills';

const PLAYERS_PAGE = 'app-page-trackplay-players';
const PLAYER_PAGE = 'app-page-trackplay-player';
const GAMES_PAGE = 'app-page-trackplay-games';
const PLAY_PAGE = 'app-page-trackplay-game-play';

const UPDATE_BUTTON = 'Übernehmen';

async function freshPage(
  page: Page,
  route: string,
  selector: string
): Promise<Locator> {
  await page.goto(`/#/${route}`);
  await page.reload();
  const root = page.locator('#main-content').locator(selector);
  await expect(root).toBeVisible({ timeout: 60_000 });
  return root;
}

function rowIn(scope: Locator, text: string): Locator {
  return scope.getByTestId('list-row').filter({ hasText: text });
}

async function saveNew(dialog: Locator): Promise<void> {
  const save = dialog.getByRole('button', { name: CREATE_BUTTON });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(dialog).toBeHidden();
}

async function createProfile(
  page: Page,
  name: string,
  type: 'person' | 'pet' = 'person'
): Promise<void> {
  const profiles = pageRoot(page, PROFILES_PAGE);
  await addButton(profiles).click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await nameBox(dialog).fill(name);
  await expect(nameBox(dialog)).toHaveValue(name);
  if (type === 'pet') {
    await dialog
      .getByTestId('vitals-profile-type')
      .getByText('Tier', { exact: true })
      .click();
  }
  await saveNew(dialog);
  await expect(profiles.getByText(name, { exact: true })).toBeVisible();
}

async function weighIn(page: Page, kg: string, on?: string): Promise<void> {
  await addButton(pageRoot(page, PROFILE_PAGE)).click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  if (on) {
    await dialog.getByTestId('vitals-reading-date').locator('input').fill(on);
  }
  await dialog.locator('app-weight-input input').first().fill(kg);
  await saveNew(dialog);
}

async function createPill(
  page: Page,
  name: string,
  dose: string,
  time: string,
  daysOff: number[] = [],
  shotName?: string
): Promise<void> {
  await addButton(pageRoot(page, PILLS_PAGE)).click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await nameBox(dialog).fill(name);
  await expect(nameBox(dialog)).toHaveValue(name);
  await dialog.getByTestId('vitals-pill-dose').locator('input').fill(dose);
  await dialog.getByTestId('vitals-pill-time').locator('input').fill(time);
  for (const index of daysOff) {
    await dialog.getByTestId('vitals-weekday').nth(index).click();
  }
  if (shotName) await shot(page, shotName);
  await saveNew(dialog);
}

test('BIOMON', async ({ page }) => {
  await bootDeck(page);
  const profiles = await openPage(page, 'vitals', PROFILES_PAGE);

  await createProfile(page, 'Martin');
  await createProfile(page, 'Luna', 'pet');

  await profiles.getByText('Martin', { exact: true }).click();
  await expect(pageRoot(page, PROFILE_PAGE)).toBeVisible({ timeout: 15_000 });

  await weighIn(page, '82,4', '2026-07-25');
  await weighIn(page, '81,8', '2026-08-01');
  await weighIn(page, '81,1', '2026-08-08');
  await weighIn(page, '80,6', '2026-08-15');
  await weighIn(page, '79,9');
  await shot(page, 'biomon-profile-chart');

  await pageRoot(page, PROFILE_PAGE).getByTestId('vitals-pills-link').click();
  await expect(pageRoot(page, PILLS_PAGE)).toBeVisible({ timeout: 15_000 });

  await createPill(page, 'Vitamin D3', '1', '08:00');
  await createPill(
    page,
    'Magnesium',
    '2',
    '21:00',
    [1, 3, 5, 6],
    'biomon-pill-dialog'
  );

  await rowIn(pageRoot(page, PILLS_PAGE), 'Vitamin D3').click();
  const takenDialog = editDialog(page);
  await expect(takenDialog).toBeVisible({ timeout: 15_000 });
  await takenDialog.getByTestId('vitals-pill-taken').click();
  await takenDialog.getByRole('button', { name: UPDATE_BUTTON }).click();
  await expect(takenDialog).toBeHidden();
  await shot(page, 'biomon-pills');

  await waitForPersisted(page, 'vitals', 'Magnesium');

  const reopened = await freshPage(page, 'vitals', PROFILES_PAGE);
  await reopened.getByText('Luna', { exact: true }).click();
  await expect(pageRoot(page, PROFILE_PAGE)).toBeVisible({ timeout: 15_000 });

  await addButton(pageRoot(page, PROFILE_PAGE)).click();
  const petDialog = createDialog(page);
  await expect(petDialog).toBeVisible({ timeout: 15_000 });
  const weightBoxes = petDialog.locator('app-weight-input input');
  await weightBoxes.nth(2).click();
  await weightBoxes.nth(2).pressSequentially('84,2');
  await petDialog.getByText('Zusammen gewogen').click(); // blur: see banner
  await expect(weightBoxes).toHaveCount(3);
  await expect(weightBoxes.first()).toHaveValue('4,3');
  await shot(page, 'biomon-pet-calculator');
  await saveNew(petDialog);

  await waitForPersisted(page, 'vitals', '4300');

  const list = await freshPage(page, 'vitals', PROFILES_PAGE);
  await shot(page, 'biomon-profiles');

  await openRowSwipe(rowIn(list, 'Martin'), 'start');
  await shot(page, 'biomon-swipe-edit');
});

async function createPlayer(page: Page, name: string): Promise<void> {
  const players = pageRoot(page, PLAYERS_PAGE);
  await addButton(players).click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await nameBox(dialog).fill(name);
  await expect(nameBox(dialog)).toHaveValue(name);
  await saveNew(dialog);
  await expect(players.getByText(name, { exact: true })).toBeVisible();
}

async function fillGameDialog(
  page: Page,
  dialog: Locator,
  name: string,
  type: string,
  players: string[]
): Promise<void> {
  await nameBox(dialog).fill(name);
  await expect(nameBox(dialog)).toHaveValue(name);
  await pickSelectOption(page, dialog.getByTestId('game-type-select'), type);
  for (const player of players) {
    await dialog
      .getByTestId('player-select-row')
      .filter({ hasText: player })
      .getByTestId('player-select-checkbox')
      .click();
  }
}

async function enterScore(
  grid: Locator,
  round: number,
  column: number,
  value: number
): Promise<void> {
  const input = grid
    .getByTestId('score-row')
    .nth(round)
    .getByTestId('score-cell')
    .nth(column)
    .locator('input');
  await input.click();
  await input.fill(String(value));
  await input.press('Enter');
}

test('TRACKPLAY', async ({ page }) => {
  await bootDeck(page);
  await openPage(page, 'trackplay/players', PLAYERS_PAGE);

  await createPlayer(page, 'Nadja');
  await createPlayer(page, 'Sven');
  await createPlayer(page, 'Tobias');

  await openPage(page, 'trackplay', GAMES_PAGE);
  await addButton(pageRoot(page, GAMES_PAGE)).click();
  const gameDialog = createDialog(page);
  await expect(gameDialog).toBeVisible({ timeout: 15_000 });
  await fillGameDialog(page, gameDialog, 'Rommé-Abend', 'Rommé', [
    'Nadja',
    'Sven',
    'Tobias',
  ]);
  await shot(page, 'trackplay-new-game');

  await gameDialog.getByRole('button', { name: 'Weiter' }).click();
  const grid = pageRoot(page, PLAY_PAGE);
  await expect(grid).toBeVisible({ timeout: 30_000 });
  await expect(grid.getByTestId('score-row')).toHaveCount(1);

  const board = [
    [25, 40, 15],
    [30, 10, 55],
    [20, 35, 25],
  ];
  for (const [round, values] of board.entries()) {
    for (const [column, value] of values.entries()) {
      await enterScore(grid, round, column, value);
    }
  }
  await expect(grid.getByTestId('score-total-cell').nth(0)).toHaveText('75');
  await shot(page, 'trackplay-play');

  await grid.getByRole('button', { name: 'Beenden' }).click();
  await expect(grid.getByText('Das Spiel ist beendet.')).toBeVisible();
  await expect(grid.getByTestId('game-winner')).toContainText('Nadja');
  await shot(page, 'trackplay-winner');

  await openPage(page, 'trackplay', GAMES_PAGE);
  await addButton(pageRoot(page, GAMES_PAGE)).click();
  const second = createDialog(page);
  await expect(second).toBeVisible({ timeout: 15_000 });
  await fillGameDialog(page, second, 'Skatrunde', 'Skat', ['Nadja', 'Sven']);
  await saveNew(second);

  await waitForPersisted(page, 'trackplay', 'Skatrunde');

  const games = await freshPage(page, 'trackplay', GAMES_PAGE);
  await expect(rowIn(games, 'Skatrunde')).toBeVisible();
  await shot(page, 'trackplay-games');

  const players = await freshPage(page, 'trackplay/players', PLAYERS_PAGE);
  await shot(page, 'trackplay-players');

  await rowIn(players, 'Nadja').getByTestId('list-row-select').click();
  const player = pageRoot(page, PLAYER_PAGE);
  await expect(player).toBeVisible({ timeout: 15_000 });
  await player.getByTestId('games-show-ended').click();
  await expect(rowIn(player, 'Rommé-Abend')).toBeVisible();

  await openRowSwipe(rowIn(player, 'Skatrunde'), 'start');
  await shot(page, 'trackplay-player-swipe');
});
