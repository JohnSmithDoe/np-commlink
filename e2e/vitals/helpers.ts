/* ─── why ─────────────────────────────────────────────────────────
 * A fresh browser context starts BIOMON with no profiles at all: the
 * module seeds nothing, so a spec creates whoever it needs to weigh.
 *
 * `weightBox` indexes the weight fields rather than naming them, because
 * an `ion-input`'s label lives in its shadow root and the pet dialog shows
 * three of them: the reading's own, the holder's, and the combined one, in
 * that order.
 *
 * Everything re-exported below belongs to the suite-wide helpers rather
 * than to this suite — the shared edit modal's copy, the shared page
 * header — while this suite's specs keep one import.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page } from '@playwright/test';
import {
  addButton,
  createDialog,
  CREATE_BUTTON,
  editDialog,
  gotoPage,
  mainContent,
  nameBox,
  pageRoot,
} from '../helpers';

export {
  addButton,
  createDialog,
  CREATE_BUTTON,
  editDialog,
  gotoPage,
  pageRoot,
};

export const PROFILES_PAGE = 'app-page-vitals-profiles';
export const PROFILE_PAGE = 'app-page-vitals-profile';

export function dateBox(dialog: Locator): Locator {
  return dialog.getByTestId('vitals-reading-date').locator('input');
}

export function weightBox(dialog: Locator, index = 0): Locator {
  return dialog.locator('app-weight-input input').nth(index);
}

export async function createProfile(
  page: Page,
  name: string,
  type: 'person' | 'pet' = 'person'
): Promise<void> {
  const profiles = pageRoot(page, PROFILES_PAGE);
  await addButton(profiles).click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await nameBox(dialog).fill(name);
  if (type === 'pet') {
    await dialog
      .getByTestId('vitals-profile-type')
      .getByText('Tier', { exact: true })
      .click();
  }
  await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
  await expect(dialog).toBeHidden();
  await expect(profiles.getByText(name, { exact: true })).toBeVisible();
}

export async function openProfile(page: Page, name: string): Promise<void> {
  await pageRoot(page, PROFILES_PAGE).getByText(name, { exact: true }).click();
  await expect(mainContent(page).locator(PROFILE_PAGE)).toBeVisible({
    timeout: 15_000,
  });
}
