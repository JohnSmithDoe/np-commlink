/* ─── why ─────────────────────────────────────────────────────────
 * The reminder half cannot be tested here at all: Playwright is not a
 * native platform, so `scheduleWeekly` refuses by design and the switch
 * only records an intention. What IS worth a real browser is everything
 * the shadow DOM hides from jsdom — the time field, the weekday buttons,
 * and the taken-today toggle that writes an intake rather than a field on
 * the pill.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { listRow } from '../helpers';
import {
  addButton,
  createDialog,
  CREATE_BUTTON,
  editDialog,
  gotoPage,
  createProfile,
  openProfile,
  PROFILE_PAGE,
  PROFILES_PAGE,
  pageRoot,
} from './helpers';

const PILLS_PAGE = 'app-page-vitals-pills';
const UPDATE_BUTTON = 'Übernehmen';

const openPills = async (page: Page, name = 'Martin') => {
  await gotoPage(page, 'vitals', PROFILES_PAGE);
  await createProfile(page, name);
  await openProfile(page, name);
  await pageRoot(page, PROFILE_PAGE).getByTestId('vitals-pills-link').click();
  await expect(pageRoot(page, PILLS_PAGE)).toBeVisible({ timeout: 15_000 });
};

const dialogNameBox = (dialog: ReturnType<typeof createDialog>) =>
  dialog.getByPlaceholder('Gib einen Namen ein');

test.describe('BIOMON — pills', () => {
  test('adds a pill with a dose, a time and picked weekdays', async ({
    page,
  }) => {
    await openPills(page);

    await addButton(pageRoot(page, PILLS_PAGE)).click();
    const dialog = createDialog(page);
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await dialogNameBox(dialog).fill('Ibuprofen 400');
    await expect(dialogNameBox(dialog)).toHaveValue('Ibuprofen 400');
    await dialog.getByTestId('vitals-pill-dose').locator('input').fill('1.5');
    await dialog.getByTestId('vitals-pill-time').locator('input').fill('18:30');

    const save = dialog.getByRole('button', { name: CREATE_BUTTON });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(dialog).toBeHidden();

    const row = listRow(page, 'Ibuprofen 400');
    await expect(row).toBeVisible();
    await expect(row).toContainText('18:30');
    await expect(row).toContainText('Täglich');
  });

  test('refuses to save a pill with no weekday left', async ({ page }) => {
    await openPills(page);

    await addButton(pageRoot(page, PILLS_PAGE)).click();
    const dialog = createDialog(page);
    await dialogNameBox(dialog).fill('Vitamin D');
    await expect(dialogNameBox(dialog)).toHaveValue('Vitamin D');

    const days = dialog.getByTestId('vitals-weekday');
    for (let index = 0; index < 7; index++) {
      await days.nth(index).click();
    }

    await expect(
      dialog.getByRole('button', { name: CREATE_BUTTON })
    ).toBeDisabled();
  });

  test('records a weekday subset and shows it on the row', async ({ page }) => {
    await openPills(page);

    await addButton(pageRoot(page, PILLS_PAGE)).click();
    const dialog = createDialog(page);
    await dialogNameBox(dialog).fill('ASS 100');
    await expect(dialogNameBox(dialog)).toHaveValue('ASS 100');

    const days = dialog.getByTestId('vitals-weekday');
    for (const index of [1, 3, 4, 5, 6]) {
      await days.nth(index).click();
    }

    await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
    await expect(dialog).toBeHidden();

    const row = listRow(page, 'ASS 100');
    await expect(row).toContainText('Mo');
    await expect(row).toContainText('Mi');
    await expect(row).not.toContainText('Täglich');
  });

  test('ticks a pill as taken today and crosses the row out', async ({
    page,
  }) => {
    await openPills(page);

    await addButton(pageRoot(page, PILLS_PAGE)).click();
    const create = createDialog(page);
    await dialogNameBox(create).fill('Magnesium');
    await expect(dialogNameBox(create)).toHaveValue('Magnesium');
    await create.getByRole('button', { name: CREATE_BUTTON }).click();
    await expect(create).toBeHidden();

    const row = listRow(page, 'Magnesium');
    await row.click();

    const edit = editDialog(page);
    await expect(edit).toBeVisible({ timeout: 15_000 });
    await edit.getByTestId('vitals-pill-taken').click();
    await edit.getByRole('button', { name: UPDATE_BUTTON }).click();
    await expect(edit).toBeHidden();

    await expect(
      listRow(page, 'Magnesium').getByTestId('list-row-label')
    ).toHaveClass(/bought/);
  });

  test('keeps the reminder switch on its own pill', async ({ page }) => {
    await openPills(page);

    await addButton(pageRoot(page, PILLS_PAGE)).click();
    const dialog = createDialog(page);
    await dialogNameBox(dialog).fill('Eisen');
    await expect(dialogNameBox(dialog)).toHaveValue('Eisen');
    await dialog.getByTestId('vitals-pill-remind').click();
    await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
    await expect(dialog).toBeHidden();

    await listRow(page, 'Eisen').click();
    const edit = editDialog(page);
    await expect(
      edit.getByTestId('vitals-pill-remind').locator('input[type="checkbox"]')
    ).not.toBeChecked();
  });
});
