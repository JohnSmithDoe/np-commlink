import { expect, test } from '@playwright/test';
import {
  createDialog,
  editDialog,
  gotoPage,
  nameBox,
  listRow,
  pageRoot,
  pickSelectOption,
  searchInput,
  slideDelete,
  waitForPersisted,
} from '../helpers';
import { createPerson, PEOPLE_PAGE } from './helpers';

test.describe('People', () => {
  test('keeps a person’s birthday, sizes and address', async ({ page }) => {
    await createPerson(page, 'Rita', { birthDate: '1990-01-26' });

    const people = pageRoot(page, PEOPLE_PAGE);
    await people.getByText('Rita', { exact: true }).click();
    const dialog = editDialog(page);
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await pickSelectOption(page, dialog.getByTestId('person-size-top'), 'M');
    await pickSelectOption(page, dialog.getByTestId('person-size-shoe'), '38');
    await dialog.getByTestId('person-add-address').click();
    await dialog
      .getByTestId('person-address-city')
      .locator('input')
      .fill('Musterstadt');
    await dialog.getByRole('button', { name: 'Übernehmen' }).click();
    await expect(dialog).toBeHidden();
    await waitForPersisted(page, 'people', 'Musterstadt');

    await page.reload();
    const row = listRow(page, 'Rita');
    await expect(row).toContainText('26.01.1990');
    await expect(row).toContainText('Oberteil M');
    await expect(row).toContainText('Schuh 38');
    await expect(row).toContainText('Musterstadt');
  });

  test('takes a deleted person back on undo', async ({ page }) => {
    await createPerson(page, 'Rita');

    await slideDelete(listRow(page, 'Rita'));
    await expect(listRow(page, 'Rita')).toHaveCount(0);

    const undo = page.getByTestId('undo-button');
    await expect(undo).toBeVisible({ timeout: 10_000 });
    await undo.click();
    await expect(listRow(page, 'Rita')).toBeVisible();
  });

  test('opens the create dialog from the search bar on enter', async ({
    page,
  }) => {
    await gotoPage(page, 'people', PEOPLE_PAGE);
    const input = searchInput(page, pageRoot(page, PEOPLE_PAGE));
    await input.fill('Ronja');
    await page.waitForTimeout(400); // > searchbar debounce (250ms)
    await input.press('Enter');

    const dialog = createDialog(page);
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(nameBox(dialog)).toHaveValue('Ronja');
  });

  test('is reachable from its own route', async ({ page }) => {
    await gotoPage(page, 'people', PEOPLE_PAGE);
    await expect(pageRoot(page, PEOPLE_PAGE)).toBeVisible();
  });
});
