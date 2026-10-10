/* ─── why ─────────────────────────────────────────────────────────
 * Callers arrive here from another module and leave again, and Ionic keeps
 * a departed page mounted — a second visit finds two `app-page-people`.
 * Reloading leaves exactly one, which is safe only because each person is
 * waited onto disk before the helper returns.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page } from '@playwright/test';
import {
  addButton,
  createDialog,
  CREATE_BUTTON,
  mainContent,
  nameBox,
  pageRoot,
  pickDate,
  waitForPersisted,
} from '../helpers';

export const PEOPLE_PAGE = 'app-page-people';

export async function createPerson(
  page: Page,
  name: string,
  {
    kind = 'person',
    birthDate,
  }: { kind?: 'person' | 'pet'; birthDate?: string } = {}
): Promise<void> {
  await page.goto('/#/people');
  await page.reload();
  await expect(mainContent(page).locator(PEOPLE_PAGE)).toBeVisible({
    timeout: 30_000,
  });
  const people = pageRoot(page, PEOPLE_PAGE);
  await addButton(people).click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await nameBox(dialog).fill(name);
  await expect(nameBox(dialog)).toHaveValue(name);
  if (kind === 'pet') {
    await dialog
      .getByTestId('person-kind')
      .getByText('Haustier', { exact: true })
      .click();
  }
  if (birthDate) {
    await pickDate(dialog.locator('app-date-input'), birthDate);
  }
  const save = dialog.getByRole('button', { name: CREATE_BUTTON });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(dialog).toBeHidden();
  await expect(people.getByText(name, { exact: true })).toBeVisible();
  await waitForPersisted(page, 'people', name);
}
