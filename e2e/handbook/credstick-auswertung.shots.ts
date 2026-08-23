/* ─── why ─────────────────────────────────────────────────────────
 * The three evaluation pages are only distinguishable when they hold a real
 * month: a burn-down with no fixed cost shows a reserve of 0, and a report
 * with one booking draws one bar and one ring segment. So each test seeds a
 * ledger first — twelve bookings over three months, five categories, one
 * booking deliberately left unfiled so the trust metric is not 0 %.
 *
 * Every test gets a fresh browser context, so seeding cannot be shared: the
 * report test seeds its own months, the burn-down test its own schedules.
 *
 * IBANs are synthesized; no bank identifier here belongs to anyone.
 * ───────────────────────────────────────────────────────────────── */
import { expect, Locator, Page, test } from '@playwright/test';
import {
  addButton,
  CREATE_BUTTON,
  nameBox,
  pageRoot,
  presentedDialog,
} from '../helpers';
import { openPage, shot } from './shot';

const SAVE = /Anlegen|Übernehmen/;

function modal(page: Page): Locator {
  return page.locator('ion-modal.show-modal');
}

function txnModal(page: Page): Locator {
  return modal(page).filter({ hasText: 'Einnahme' });
}

function iso(monthsBack: number, day: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function todayISO(): string {
  return iso(0, new Date().getDate());
}

async function createAccount(
  page: Page,
  name: string,
  balance: string,
  kind?: string
): Promise<void> {
  const accounts = await openPage(page, 'cash', 'app-page-cash');
  await accounts.getByTestId('page-header-add').click();
  const dialog = presentedDialog(page, 'Neuen Eintrag anlegen');
  await nameBox(dialog).fill(name);
  if (kind) {
    await dialog.getByTestId('account-kind').click();
    const alert = page.locator('ion-alert');
    await expect(alert).toBeVisible();
    await alert.getByRole('radio', { name: kind }).click();
    await alert.getByRole('button', { name: 'OK' }).click();
    await expect(alert).toBeHidden();
  }
  await dialog.locator('app-money-input input').fill(balance);
  await dialog.getByRole('button', { name: CREATE_BUTTON }).click();
  await expect(modal(page)).toBeHidden({ timeout: 15_000 });
}

async function pickCategory(page: Page, category: string): Promise<void> {
  await txnModal(page).getByTestId('category-input-trigger').click();
  const search = page.getByTestId('category-picker-search').locator('input');
  await expect(search).toBeVisible({ timeout: 15_000 });
  await search.fill(category);
  await page.waitForTimeout(400); // searchbar debounce
  const create = page.getByText(`${category} erstellen`);
  const existing = page
    .locator('ion-modal.show-modal ion-item-sliding ion-label')
    .filter({ hasText: category });
  const target = (await create.count()) ? create : existing;
  await target.first().click();
  await expect(search).toBeHidden({ timeout: 15_000 });
}

interface Booking {
  name: string;
  amount: string;
  dateISO: string;
  income?: boolean;
  category?: string;
}

async function addBooking(
  page: Page,
  ledger: Locator,
  booking: Booking
): Promise<void> {
  await ledger.getByTestId('page-header-add').click();
  const dialog = txnModal(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await nameBox(dialog).fill(booking.name);
  if (booking.income) {
    await dialog
      .locator('ion-segment-button')
      .filter({ hasText: 'Einnahme' })
      .click();
  }
  await dialog.locator('app-money-input input').fill(booking.amount);
  await dialog.locator('input[type="date"]').fill(booking.dateISO);
  if (booking.category) await pickCategory(page, booking.category);
  await dialog.getByRole('button', { name: SAVE }).click();
  await expect(modal(page)).toBeHidden({ timeout: 15_000 });
}

async function scrollTo(target: Locator): Promise<void> {
  await target
    .first()
    .evaluate((element) => element.scrollIntoView({ block: 'start' }));
  await target.page().waitForTimeout(400);
}

test('report over a seeded quarter', async ({ page }) => {
  await createAccount(page, 'GIRO Alltag', '2480,00', 'Girokonto');

  const accounts = pageRoot(page, 'app-page-cash');
  await accounts.getByTestId('list-row').first().click();
  const ledger = pageRoot(page, 'app-page-cash-account');
  await expect(ledger).toBeVisible({ timeout: 15_000 });

  const bookings: Booking[] = [
    { name: 'Lohn', amount: '3480,00', dateISO: iso(0, 1), income: true },
    {
      name: 'Miete',
      amount: '1150,00',
      dateISO: iso(0, 2),
      category: 'Wohnen',
    },
    {
      name: 'Stromabschlag',
      amount: '92,00',
      dateISO: iso(0, 3),
      category: 'Wohnen',
    },
    {
      name: 'Wocheneinkauf',
      amount: '86,40',
      dateISO: iso(0, 6),
      category: 'Lebensmittel',
    },
    {
      name: 'Bahnticket',
      amount: '49,00',
      dateISO: iso(0, 8),
      category: 'Mobilität',
    },
    {
      name: 'Kaffeeröster',
      amount: '14,80',
      dateISO: iso(0, 9),
      category: 'Verpflegung',
    },
    {
      name: 'Kinoabend',
      amount: '27,50',
      dateISO: iso(0, 11),
      category: 'Freizeit',
    },
    { name: 'Zahnarztrechnung', amount: '78,50', dateISO: iso(0, 12) },
    { name: 'Lohn', amount: '3480,00', dateISO: iso(1, 1), income: true },
    {
      name: 'Miete',
      amount: '1150,00',
      dateISO: iso(1, 2),
      category: 'Wohnen',
    },
    {
      name: 'Wocheneinkauf',
      amount: '104,20',
      dateISO: iso(1, 7),
      category: 'Lebensmittel',
    },
    { name: 'Lohn', amount: '3480,00', dateISO: iso(2, 1), income: true },
    {
      name: 'Miete',
      amount: '1150,00',
      dateISO: iso(2, 2),
      category: 'Wohnen',
    },
  ];

  for (const booking of bookings) await addBooking(page, ledger, booking);

  await openPage(page, 'cash', 'app-page-cash');
  await shot(page, 'credstick-auswertung-nav');

  const report = await openPage(page, 'cash/report', 'app-page-cash-report');
  await expect(report.getByTestId('report-uncategorized')).toBeVisible();
  await shot(page, 'credstick-auswertung-report-monat');

  await report
    .getByTestId('report-scope')
    .locator('ion-segment-button')
    .filter({ hasText: 'Alles' })
    .click();
  await page.waitForTimeout(700);
  await shot(page, 'credstick-auswertung-report-alles');

  await scrollTo(report.locator('h2', { hasText: 'Nach Kategorie' }));
  await shot(page, 'credstick-auswertung-report-kategorien');

  await scrollTo(report.locator('h2', { hasText: 'Größte Ausgaben' }));
  await shot(page, 'credstick-auswertung-report-groesste');
});

test('burn-down and daily spending over a seeded month', async ({ page }) => {
  await createAccount(page, 'GIRO Alltag', '2480,00', 'Girokonto');
  await createAccount(page, 'BARGELD', '120,00');

  const schedules = await openPage(
    page,
    'cash/schedules',
    'app-page-cash-schedules'
  );

  const fixedCosts = [
    { name: 'Miete', amount: '1150,00', due: iso(-1, 1), match: 'MIETE' },
    { name: 'Stromabschlag', amount: '92,00', due: iso(1, 5), match: 'STROM' },
    { name: 'Mobilfunk', amount: '39,90', due: todayISO(), match: 'MOBILFUNK' },
  ];

  for (const cost of fixedCosts) {
    await addButton(schedules).click();
    const dialog = presentedDialog(page, 'Neuen Eintrag anlegen');
    await nameBox(dialog).fill(cost.name);
    await dialog.locator('app-money-input input').fill(cost.amount);
    await dialog
      .getByTestId('condition-value')
      .locator('input')
      .fill(cost.match);
    await dialog
      .getByTestId('schedule-next-due')
      .locator('input')
      .fill(cost.due);
    await dialog.getByRole('button', { name: SAVE }).click();
    await expect(modal(page)).toBeHidden({ timeout: 15_000 });
  }

  const spending = await openPage(
    page,
    'cash/spending',
    'app-page-cash-spending'
  );
  const bookPreset = async (preset: string): Promise<void> => {
    await spending
      .getByTestId('spend-preset')
      .filter({ hasText: new RegExp(String.raw`^\s*${preset}`) })
      .click();
    await spending.getByTestId('spend-book').click();
    await page.waitForTimeout(400);
  };

  await spending.getByTestId('category-input-trigger').click();
  const search = page.getByTestId('category-picker-search').locator('input');
  await expect(search).toBeVisible({ timeout: 15_000 });
  await search.fill('Verpflegung');
  await page.waitForTimeout(400); // searchbar debounce
  await page.getByText('Verpflegung erstellen').click();
  await expect(search).toBeHidden({ timeout: 15_000 });

  await bookPreset('5,00');

  await spending
    .getByTestId('spend-method-option')
    .filter({ hasText: 'Karte' })
    .click();
  await expect(spending.getByTestId('spend-settles-later')).toBeVisible();
  await bookPreset('12,00');

  await expect(spending.getByTestId('spending-row').first()).toBeVisible();
  await shot(page, 'credstick-auswertung-ausgaben');

  const burndown = await openPage(
    page,
    'cash/burndown',
    'app-page-cash-burndown'
  );
  await expect(burndown.getByTestId('burndown-per-day')).toBeVisible();
  await shot(page, 'credstick-auswertung-tagesbudget');

  await scrollTo(burndown.locator('ion-list-header'));
  await shot(page, 'credstick-auswertung-tagesbudget-ueberfaellig');
});
