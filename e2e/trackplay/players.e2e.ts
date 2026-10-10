/* ─── why ─────────────────────────────────────────────────────────
 * The roster is borrowed from the people program, so the reload test now
 * guards the KERNEL's boot hydration: the players page reads persons the
 * people slice restored, and nothing of trackplay's own.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { listRow, waitForPersisted } from '../helpers';
import { createPerson, PEOPLE_PAGE } from '../people/helpers';
import {
  addButton,
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

  test('sends the add button to the people program', async ({ page }) => {
    await gotoPage(page, 'trackplay/players', PLAYERS_PAGE);

    await addButton(pageRoot(page, PLAYERS_PAGE)).click();

    await expect(page).toHaveURL(/#\/people$/);
    await expect(mainContent(page).locator(PEOPLE_PAGE)).toBeVisible();
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
