/* ─── why ─────────────────────────────────────────────────────────
 * The roster is borrowed from the people program, so the reload test now
 * guards the KERNEL's boot hydration: the players page reads persons the
 * people slice restored, and nothing of trackplay's own.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import {
  createDialog,
  CREATE_BUTTON,
  listRow,
  nameBox,
  searchInput,
  waitForPersisted,
} from '../helpers';
import { createPerson } from '../people/helpers';
import {
  createPlayer,
  gotoPage,
  mainContent,
  pageRoot,
  PLAYERS_PAGE,
} from './helpers';

test.describe('trackplay players', () => {
  test('lists the persons of the people program, and no pet', async ({
    page,
  }) => {
    await createPlayer(page, 'Alice');
    await createPlayer(page, 'Bob');
    await createPerson(page, 'Mieze', { kind: 'pet' });

    await gotoPage(page, 'trackplay/players', PLAYERS_PAGE);

    const rows = pageRoot(page, PLAYERS_PAGE).getByTestId('list-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'Alice' })).toBeVisible();
    await expect(rows.filter({ hasText: 'Bob' })).toBeVisible();
  });

  test('creates a person from the search on Enter, without leaving', async ({
    page,
  }) => {
    await gotoPage(page, 'trackplay/players', PLAYERS_PAGE);
    const input = searchInput(page, pageRoot(page, PLAYERS_PAGE));
    await input.fill('Dunkelzahn');
    await page.waitForTimeout(400); // > searchbar debounce (250ms)
    await input.press('Enter');

    const dialog = createDialog(page);
    await expect(nameBox(dialog)).toHaveValue('Dunkelzahn');
    await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
    await expect(dialog).toBeHidden();

    await expect(page).toHaveURL(/#\/trackplay\/players$/);
    await expect(listRow(page, 'Dunkelzahn')).toBeVisible();
    await waitForPersisted(page, 'people', 'Dunkelzahn');
  });

  test('keeps players across a full reload', async ({ page }) => {
    await createPlayer(page, 'Dunkelzahn');
    await waitForPersisted(page, 'people', 'Dunkelzahn');

    await page.reload();
    await expect(mainContent(page).locator(PLAYERS_PAGE)).toBeVisible({
      timeout: 30_000,
    });

    await expect(listRow(page, 'Dunkelzahn')).toBeVisible();
  });
});
