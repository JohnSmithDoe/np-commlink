import { expect, Locator, Page, test } from '@playwright/test';
import {
  addButton,
  CREATE_BUTTON,
  createDialog,
  listRow,
  nameBox,
  openRowSwipe,
  pageRoot,
  pickSelectOption,
} from '../helpers';
import { bootDeck, openPage, shot } from './shot';

const anyModal = (page: Page): Locator => page.locator('ion-modal.show-modal');

const pickerModal = (page: Page): Locator =>
  anyModal(page).filter({ has: page.getByTestId('category-picker-search') });

async function closeRowSwipe(row: Locator): Promise<void> {
  await row.evaluate((element: HTMLElement & { close(): Promise<void> }) =>
    element.close()
  );
}

async function createAccount(
  page: Page,
  name: string,
  kindLabel: string,
  openingEur: string
): Promise<void> {
  const accounts = pageRoot(page, 'app-page-cash');
  await addButton(accounts).click();
  const modal = createDialog(page);
  await expect(modal).toBeVisible();
  await nameBox(modal).fill(name);
  await pickSelectOption(page, modal.getByTestId('account-kind'), kindLabel);
  await modal.locator('app-money-input input').fill(openingEur);
  await modal.getByRole('button', { name: CREATE_BUTTON }).click();
  await expect(anyModal(page)).toBeHidden();
  await expect(listRow(page, name)).toBeVisible();
}

async function pickCategory(
  page: Page,
  modal: Locator,
  name: string
): Promise<void> {
  await modal.getByTestId('category-input-trigger').click();
  const picker = pickerModal(page);
  const search = picker.getByTestId('category-picker-search').locator('input');
  await expect(search).toBeVisible();
  await search.fill(name);
  const create = picker.getByText(`${name} erstellen`);
  const existing = picker.getByRole('option', { name }).first();
  await expect(create.or(existing).first()).toBeVisible();
  await ((await create.isVisible()) ? create.click() : existing.click());
  await expect(picker).toBeHidden();
  await expect(
    modal.locator('app-category-input').getByText(name)
  ).toBeVisible();
}

async function addBooking(
  page: Page,
  options: {
    name: string;
    amountEur: string;
    income?: boolean;
    category?: string;
  }
): Promise<void> {
  const account = pageRoot(page, 'app-page-cash-account');
  await addButton(account).click();
  const modal = createDialog(page);
  await expect(modal).toBeVisible();
  await nameBox(modal).fill(options.name);
  if (options.income) {
    await modal
      .locator('ion-segment-button')
      .filter({ hasText: 'Einnahme' })
      .click();
  }
  await modal.locator('app-money-input input').fill(options.amountEur);
  if (options.category) await pickCategory(page, modal, options.category);
  await modal.getByRole('button', { name: CREATE_BUTTON }).click();
  await expect(anyModal(page)).toBeHidden();
  await expect(account.getByText(options.name).first()).toBeVisible();
}

test('credstick handbook shots', async ({ page }) => {
  await bootDeck(page);

  await openPage(page, 'cash', 'app-page-cash');
  await createAccount(page, 'Hauptkonto', 'Girokonto', '1842,60');
  await createAccount(page, 'Portemonnaie', 'Bargeld', '45,00');
  await shot(page, 'credstick-accounts');

  await listRow(page, 'Hauptkonto').getByTestId('list-row-select').click();
  await expect(pageRoot(page, 'app-page-cash-account')).toBeVisible();

  await addBooking(page, {
    name: 'Gehalt August',
    amountEur: '2480,00',
    income: true,
    category: 'Einkommen',
  });
  await addBooking(page, {
    name: 'Nordkauf Wochenkauf',
    amountEur: '62,45',
    category: 'Lebensmittel',
  });
  await addBooking(page, {
    name: 'Stadtwerke Abschlag',
    amountEur: '89,00',
    category: 'Wohnen',
  });
  await addBooking(page, { name: 'Baeckerei Ecke', amountEur: '7,20' });
  await addBooking(page, { name: 'Kiosk Zeitschrift', amountEur: '4,90' });
  await shot(page, 'credstick-ledger');

  const row = listRow(page, 'Kiosk Zeitschrift');
  await openRowSwipe(row, 'end');
  await shot(page, 'credstick-swipe-delete');
  await closeRowSwipe(row);

  const account = pageRoot(page, 'app-page-cash-account');
  await addButton(account).click();
  const draft = createDialog(page);
  await expect(draft).toBeVisible();
  await nameBox(draft).fill('Zahnarzt Eigenanteil');
  await draft.locator('app-money-input input').fill('128,50');
  await pickCategory(page, draft, 'Gesundheit');
  await shot(page, 'credstick-booking-dialog');

  await draft.getByTestId('category-input-trigger').click();
  const picker = pickerModal(page);
  await expect(
    picker.getByTestId('category-picker-search').locator('input')
  ).toBeVisible();
  await shot(page, 'credstick-category-picker');

  await picker
    .getByTestId('category-picker-search')
    .locator('input')
    .fill('Freizeit');
  await expect(picker.getByText('Freizeit erstellen')).toBeVisible();
  await shot(page, 'credstick-category-new');

  await picker.getByRole('button', { name: 'Abbrechen' }).first().click();
  await expect(picker).toBeHidden();
  await draft.getByRole('button', { name: CREATE_BUTTON }).click();
  await expect(anyModal(page)).toBeHidden();

  await openPage(page, 'cash/uncategorized', 'app-page-cash-uncategorized');
  await expect(page.getByTestId('uncategorized-row').first()).toBeVisible();
  await shot(page, 'credstick-uncategorized');
});
