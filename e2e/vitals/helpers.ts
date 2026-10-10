/* ─── why ─────────────────────────────────────────────────────────
 * BIOMON owns no roster: a profile is a person from the people program,
 * so `createProfile` creates one there and comes back. A fresh context
 * has nobody, and a spec creates whoever it needs to weigh.
 *
 * `weightBox` indexes the weight fields rather than naming them, because
 * an `ion-input`'s label lives in its shadow root and the pet dialog shows
 * three of them: the reading's own, the holder's, and the combined one.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page } from '@playwright/test';
import {
  addButton,
  createDialog,
  CREATE_BUTTON,
  editDialog,
  gotoPage,
  mainContent,
  pageRoot,
} from '../helpers';
import { createPerson } from '../people/helpers';

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

export function dateField(dialog: Locator): Locator {
  return dialog.locator('app-date-input');
}

export function weightBox(dialog: Locator, index = 0): Locator {
  return dialog.locator('app-weight-input input').nth(index);
}

export async function createProfile(
  page: Page,
  name: string,
  kind: 'person' | 'pet' = 'person',
  birthDate?: string
): Promise<void> {
  await createPerson(page, name, { kind, birthDate });
  await gotoPage(page, 'vitals', PROFILES_PAGE);
  await expect(
    pageRoot(page, PROFILES_PAGE).getByText(name, { exact: true })
  ).toBeVisible();
}

export async function openProfile(page: Page, name: string): Promise<void> {
  await pageRoot(page, PROFILES_PAGE).getByText(name, { exact: true }).click();
  await expect(mainContent(page).locator(PROFILE_PAGE)).toBeVisible({
    timeout: 15_000,
  });
}
