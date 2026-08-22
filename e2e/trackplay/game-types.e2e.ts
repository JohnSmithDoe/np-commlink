/* ─── why ─────────────────────────────────────────────────────────
 * The two tests differ by a single click, because the toggle's DEFAULT is
 * win-high: the win-low case flips it, the win-high case deliberately
 * touches nothing. A default cannot be read off a spec that always sets
 * the value, which is what the untouched case is for.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { listRow } from '../helpers';
import {
  CREATE_BUTTON,
  createDialog,
  gotoPage,
  mainContent,
  nameBox,
} from './helpers';

test.describe('trackplay game types', () => {
  test('creates a win-low game type via the dialog', async ({ page }) => {
    await gotoPage(
      page,
      'trackplay/game-types',
      'app-page-trackplay-game-types'
    );

    await mainContent(page).getByTestId('page-header-add').click();

    const dialog = createDialog(page);
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await nameBox(dialog).fill('Doppelkopf');
    await dialog.getByTestId('win-high-toggle').click();
    await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
    await expect(dialog).toBeHidden();

    const createdRow = listRow(page, 'Doppelkopf');
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText('Niedrigste Punktzahl gewinnt');
  });

  test('creates a win-high game type via the dialog', async ({ page }) => {
    await gotoPage(
      page,
      'trackplay/game-types',
      'app-page-trackplay-game-types'
    );

    await mainContent(page).getByTestId('page-header-add').click();

    const dialog = createDialog(page);
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await nameBox(dialog).fill('Canasta');
    await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
    await expect(dialog).toBeHidden();

    const createdRow = listRow(page, 'Canasta');
    await expect(createdRow).toBeVisible();
    await expect(createdRow).toContainText('Höchste Punktzahl gewinnt');
  });
});
