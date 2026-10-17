import { expect, Locator, Page, test } from '@playwright/test';
import {
  editDialog,
  listRow,
  openRowSwipe,
  pageRoot,
  pickSelectOption,
  waitForPersisted,
} from '../helpers';
import { createPerson, PEOPLE_PAGE } from '../people/helpers';
import { bootDeck, openPage, shot, shotOf } from './shot';

const addressField = (dialog: Locator, index: number): Locator =>
  dialog.locator('.person-address ion-item').nth(index).locator('input');

const openPerson = async (page: Page, name: string): Promise<Locator> => {
  await pageRoot(page, PEOPLE_PAGE).getByText(name, { exact: true }).click();
  const dialog = editDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  return dialog;
};

const accept = async (page: Page, dialog: Locator, marker: string) => {
  await dialog.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(dialog).toBeHidden();
  await waitForPersisted(page, 'people', marker);
};

test('sin — people list, dialog and swipe', async ({ page }) => {
  await bootDeck(page);

  await createPerson(page, 'Rita', { birthDate: '1990-01-26' });
  await createPerson(page, 'Jonas', { birthDate: '2016-05-12' });
  await createPerson(page, 'Ole', { kind: 'pet', birthDate: '2019-03-03' });

  const rita = await openPerson(page, 'Rita');
  await pickSelectOption(page, rita.getByTestId('person-size-top'), 'M');
  await pickSelectOption(page, rita.getByTestId('person-size-shoe'), '38');
  await shot(page, 'sin-dialog');

  await rita.getByTestId('person-add-address').click();
  await addressField(rita, 0).fill('Lindenallee 12');
  await addressField(rita, 1).fill('12345');
  await addressField(rita, 2).fill('Musterstadt');
  await shot(page, 'sin-adresse');
  await accept(page, rita, 'Musterstadt');

  const jonas = await openPerson(page, 'Jonas');
  await pickSelectOption(page, jonas.getByTestId('person-size-top'), '140');
  await pickSelectOption(page, jonas.getByTestId('person-size-shoe'), '33');
  await accept(page, jonas, '"140"');

  await expect(listRow(page, 'Rita')).toContainText('Musterstadt');
  await shot(page, 'sin-liste');

  await openRowSwipe(listRow(page, 'Jonas'), 'end');
  await shot(page, 'sin-wischen-loeschen');

  await openPage(page, 'commlink', 'app-page-commlink');
  const tile = page
    .getByTestId('deck-tile')
    .filter({ hasText: /\bSIN\b/ })
    .first();
  await expect(tile).toBeVisible();
  await expect(page.locator('ion-toast:not(.overlay-hidden)')).toHaveCount(0);
  await shotOf(tile, 'sin-deck-kachel');
});
