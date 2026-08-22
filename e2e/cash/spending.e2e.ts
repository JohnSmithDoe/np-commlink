/* ─── why ─────────────────────────────────────────────────────────
 * The composer is arithmetic over the store, so unit specs prove the sign,
 * the status and the account each method resolves to. What only a browser
 * shows is that a tap ARRIVES: a preset, a segment and a select feed one
 * dispatch, and the figure that has to move afterwards lives behind a
 * different facade on the accounts page.
 *
 * The card test asserts the picked account and the untouched sibling, which
 * is the failure with consequences — a spend booked to the wrong card is a
 * wrong balance on two accounts and nothing on screen says so.
 *
 * Presets are matched on an ANCHORED amount: a bare '5,00' also matches the
 * '15,00' button, and the looser locator picks whichever Playwright saw
 * first rather than failing.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  listRow,
  pageRoot,
  pickSelectOption,
  presentedDialog,
  waitForPersisted,
} from '../helpers';

const SPENDING = '/#/cash/spending';

function spendingPage(page: Page): Locator {
  return pageRoot(page, 'app-page-cash-spending');
}

function dialog(page: Page): Locator {
  return page.locator('ion-modal.show-modal');
}

async function openSpending(page: Page) {
  await page.goto(SPENDING);
  await expect(spendingPage(page)).toBeVisible({ timeout: 30_000 });
}

async function createAccount(
  page: Page,
  name: string,
  balance: string,
  kind?: string
) {
  await page.goto('/#/cash');
  const accounts = pageRoot(page, 'app-page-cash');
  await expect(accounts).toBeVisible({ timeout: 30_000 });

  await accounts.getByTestId('page-header-add').click();
  const create = presentedDialog(page, 'Neuen Eintrag anlegen');
  await create.getByRole('textbox', { name: 'Name' }).fill(name);
  if (kind) {
    await pickSelectOption(page, create.getByTestId('account-kind'), kind);
  }
  await create.locator('app-money-input input').fill(balance);
  await create.getByRole('button', { name: 'Anlegen' }).click();
  await expect(dialog(page)).toBeHidden({ timeout: 10_000 });
  await waitForPersisted(page, 'cash', name);
}

function preset(page: Page, amount: string): Locator {
  return spendingPage(page)
    .getByTestId('spend-preset')
    .filter({ hasText: new RegExp(String.raw`^\s*${amount}`) });
}

async function book(page: Page, amount: string) {
  await preset(page, amount).click();
  await spendingPage(page).getByTestId('spend-book').click();
}

test.describe('cash daily spending', () => {
  test('a preset booked as cash lands against today', async ({ page }) => {
    await createAccount(page, 'BARGELD', '200,00');
    await openSpending(page);

    await expect(
      spendingPage(page).getByTestId('spending-empty')
    ).toBeVisible();

    await book(page, '10,00');

    await expect(spendingPage(page).getByTestId('spending-row')).toHaveCount(1);
    await expect(
      spendingPage(page).getByTestId('spending-remaining-today')
    ).toContainText(/10,00/);

    await page.goto('/#/cash');
    await expect(listRow(page, 'BARGELD')).toContainText('190,00');
  });

  test('books a card spend to the card the payer picked', async ({ page }) => {
    await createAccount(page, 'GIRO', '500,00', 'Girokonto');
    await createAccount(page, 'KREDIT', '0,00', 'Kreditkarte');
    await openSpending(page);

    await spendingPage(page)
      .getByTestId('spend-method-option')
      .filter({ hasText: 'Karte' })
      .click();
    await expect(
      spendingPage(page).getByTestId('spend-settles-later')
    ).toBeVisible();
    await pickSelectOption(
      page,
      spendingPage(page).getByTestId('spend-account'),
      'KREDIT'
    );

    await book(page, '12,00');
    await expect(spendingPage(page).getByTestId('spending-row')).toContainText(
      'Vorgemerkt'
    );

    await page.goto('/#/cash');
    await expect(listRow(page, 'KREDIT')).toContainText('-12,00');
    await expect(listRow(page, 'GIRO')).toContainText('500,00');
  });

  test('names the method it cannot pay with, not both of them', async ({
    page,
  }) => {
    await createAccount(page, 'BARGELD', '50,00');
    await openSpending(page);

    await spendingPage(page)
      .getByTestId('spend-method-option')
      .filter({ hasText: 'Karte' })
      .click();

    await expect(
      spendingPage(page).getByTestId('spend-no-account')
    ).toContainText('Kartenkonto');
    await expect(spendingPage(page).getByTestId('spend-book')).toBeHidden();
  });

  test('is reachable from the burn-down, which no longer composes', async ({
    page,
  }) => {
    await page.goto('/#/cash/burndown');
    const burndown = pageRoot(page, 'app-page-cash-burndown');
    await expect(burndown).toBeVisible({ timeout: 30_000 });

    await expect(burndown.getByTestId('spend-book')).toHaveCount(0);
    await burndown.getByTestId('burndown-spending-link').click();

    await expect(spendingPage(page)).toBeVisible({ timeout: 10_000 });
  });
});
