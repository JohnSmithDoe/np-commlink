/* ─── why ─────────────────────────────────────────────────────────
 * The pet path is here rather than in a unit spec because the numbers it
 * subtracts come from three separate `ion-input`s inside a presented
 * modal, and jsdom renders none of them.
 *
 * The second tap on `add` asserts the rule the dialog exists to keep: one
 * reading per profile per day, reached by editing today's rather than
 * refusing a second one at save time.
 *
 * Nobody picks the holder here because there is only one person to pick,
 * and the dialog starts on them — which is the half a unit spec cannot
 * show, since the prefilled weight arrives through an `ion-input`.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { listRow, searchInput } from '../helpers';
import {
  addButton,
  createDialog,
  CREATE_BUTTON,
  dateBox,
  editDialog,
  gotoPage,
  openProfile,
  createProfile,
  PROFILE_PAGE,
  PROFILES_PAGE,
  pageRoot,
  weightBox,
} from './helpers';

const openProfiles = (page: Page) => gotoPage(page, 'vitals', PROFILES_PAGE);

const weighIn = async (page: Page, kg: string, on?: string) => {
  await addButton(pageRoot(page, PROFILE_PAGE)).click();
  const dialog = createDialog(page);
  if (on) await dateBox(dialog).fill(on);
  await weightBox(dialog).fill(kg);
  await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
  await expect(dialog).toBeHidden();
};

const openFreshProfile = async (page: Page, name = 'Martin') => {
  await openProfiles(page);
  await createProfile(page, name);
  await openProfile(page, name);
};

test.describe('BIOMON', () => {
  test('starts with no profiles at all', async ({ page }) => {
    await openProfiles(page);

    await expect(listRow(page, /./)).toHaveCount(0);
  });

  test('opens today’s reading for editing instead of adding a second', async ({
    page,
  }) => {
    await openFreshProfile(page);
    await expect(searchInput(page, pageRoot(page, PROFILE_PAGE))).toHaveCount(
      0
    );

    await weighIn(page, '78,4');

    await expect(listRow(page, '78,4 kg')).toHaveCount(1);

    await addButton(pageRoot(page, PROFILE_PAGE)).click();

    const editing = editDialog(page);
    await expect(editing).toBeVisible();
    await expect(weightBox(editing)).toHaveValue('78,4');
    await expect(listRow(page, '78,4 kg')).toHaveCount(1);
  });

  test('derives a pet’s weight from the combined reading', async ({ page }) => {
    await openFreshProfile(page);
    await weighIn(page, '80,0');

    await openProfiles(page);
    await createProfile(page, 'Katze', 'pet');
    await openProfile(page, 'Katze');

    await addButton(pageRoot(page, PROFILE_PAGE)).click();
    const dialog = createDialog(page);
    await expect(dialog.getByTestId('vitals-holder-select')).toContainText(
      'Martin'
    );
    await expect(weightBox(dialog, 1)).toHaveValue('80,0');

    await weightBox(dialog, 2).fill('84,3');
    await expect(weightBox(dialog)).toHaveValue('4,3');

    await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
    await expect(dialog).toBeHidden();
    await expect(listRow(page, '4,3 kg')).toBeVisible();
  });

  test('back-dates a reading, then draws the trend and the profile row', async ({
    page,
  }) => {
    await openFreshProfile(page);
    const chart = pageRoot(page, PROFILE_PAGE).locator(
      'app-weight-chart canvas'
    );

    await weighIn(page, '79,2', '2026-02-10');
    await expect(listRow(page, '79,2 kg')).toBeVisible();
    await expect(chart).toHaveCount(0);

    await weighIn(page, '78,4');

    await expect(listRow(page, '79,2 kg')).toBeVisible();
    await expect(listRow(page, '78,4 kg')).toBeVisible();
    await expect(chart).toBeVisible();

    await openProfiles(page);

    await expect(listRow(page, 'Martin').getByText('78,4 kg')).toBeVisible();
  });
});
