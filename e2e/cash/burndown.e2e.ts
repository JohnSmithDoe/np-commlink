/* ─── why ─────────────────────────────────────────────────────────
 * The allowance is arithmetic over the store, so a unit spec proves the
 * number. What only a browser shows is that the number ARRIVES: the page
 * reads a facade whose `todayISO` is a signal set in the constructor, and a
 * schedule saved through the dialog has to reach it through the reducer's
 * `applyAmountChanges` sibling path.
 *
 * The reserve and the balance are asserted, never the per-day figure: that one
 * divides by the days left in the real month, so it would pass or fail by the
 * calendar. A reserve for a schedule due next month is `amount ÷ 1` whatever
 * today is, and an excluded balance is 0 on every date.
 *
 * Rows are looked up UNDER the page root, not page-wide. Navigating away and
 * back leaves the outlet holding two mounted copies of the accounts page, so a
 * page-wide `list-row` matches the same account twice.
 *
 * The fixed cost is created on `/cash/schedules`, which owns the list, and
 * read back on the burn-down: two pages over one store through two facades,
 * and that seam is the half a unit spec cannot reach.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import { pageRoot, presentedDialog, waitForPersisted } from '../helpers';

const BURNDOWN = '/#/cash/burndown';
const SCHEDULES = '/#/cash/schedules';

function burndownPage(page: Page): Locator {
  return pageRoot(page, 'app-page-cash-burndown');
}

function schedulesPage(page: Page): Locator {
  return pageRoot(page, 'app-page-cash-schedules');
}

function dialog(page: Page): Locator {
  return page.locator('ion-modal.show-modal');
}

async function openBurndown(page: Page) {
  await page.goto(BURNDOWN);
  await expect(burndownPage(page)).toBeVisible({ timeout: 30_000 });
}

async function openSchedules(page: Page) {
  await page.goto(SCHEDULES);
  await expect(schedulesPage(page)).toBeVisible({ timeout: 30_000 });
}

async function createRent(page: Page) {
  await schedulesPage(page)
    .getByRole('button', { name: 'Festkosten hinzufügen' })
    .click();
  const modal = presentedDialog(page, 'Neuen Eintrag anlegen');

  await modal.getByRole('textbox', { name: 'Name' }).fill('Miete');
  await modal.locator('app-money-input input').fill('900,00');
  await modal
    .getByTestId('schedule-condition-value')
    .locator('input')
    .fill('MIETE');

  const nextMonth = await page.evaluate(() => {
    const now = new Date();
    const due = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-01`;
  });
  await modal.getByTestId('schedule-next-due').locator('input').fill(nextMonth);

  await modal.getByRole('button', { name: /Anlegen|Übernehmen/ }).click();
  await expect(dialog(page)).toBeHidden({ timeout: 10_000 });
}

test.describe('cash burndown', () => {
  test('shows an empty allowance before any fixed cost exists', async ({
    page,
  }) => {
    await openBurndown(page);

    await expect(
      burndownPage(page).getByTestId('burndown-per-day')
    ).toBeVisible();
    await expect(burndownPage(page).getByTestId('burndown-reserve')).toHaveText(
      /0,00/
    );
    await expect(
      burndownPage(page).getByTestId('burndown-schedules-link')
    ).toContainText('0 Posten');
  });

  test('a saved fixed cost reserves against the allowance', async ({
    page,
  }) => {
    await openSchedules(page);
    await createRent(page);

    await expect(
      schedulesPage(page).getByTestId('cash-schedule-row')
    ).toHaveCount(1);
    await expect(
      schedulesPage(page).getByTestId('schedules-monthly')
    ).toHaveText(/900,00/);
    await waitForPersisted(page, 'cash', 'Miete');

    await openBurndown(page);
    await expect(burndownPage(page).getByTestId('burndown-reserve')).toHaveText(
      /900,00/
    );
  });

  test('marking a fixed cost paid reports it as seen', async ({ page }) => {
    await openSchedules(page);
    await createRent(page);

    await schedulesPage(page).getByTestId('schedule-mark-seen').click();

    await expect(
      schedulesPage(page).getByTestId('cash-schedule-row')
    ).toContainText('bezahlt', { timeout: 10_000 });
    await expect(
      schedulesPage(page).getByTestId('schedules-confirmed')
    ).toHaveText(/900,00/);
  });

  test('an excluded account keeps its balance out of the allowance', async ({
    page,
  }) => {
    await page.goto('/#/cash');
    const accounts = pageRoot(page, 'app-page-cash');
    await expect(accounts).toBeVisible({ timeout: 30_000 });

    await accounts.getByTestId('page-header-add').click();
    const create = presentedDialog(page, 'Neuen Eintrag anlegen');
    await create.getByRole('textbox', { name: 'Name' }).fill('RUECKLAGE');
    await create.locator('app-money-input input').fill('5000,00');
    await create.getByRole('button', { name: 'Anlegen' }).click();
    await expect(dialog(page)).toBeHidden({ timeout: 10_000 });

    await openBurndown(page);
    await expect(
      burndownPage(page).getByTestId('burndown-balance')
    ).toContainText(/5.000,00/);

    await page.goto('/#/cash');
    await accounts
      .getByTestId('list-row')
      .filter({ hasText: 'RUECKLAGE' })
      .first()
      .click();
    const ledger = pageRoot(page, 'app-page-cash-account');
    await expect(ledger).toBeVisible({ timeout: 10_000 });
    await ledger.getByRole('button', { name: 'Konto bearbeiten' }).click();
    const edit = page.locator('ion-modal.show-modal');
    await expect(edit).toBeVisible({ timeout: 10_000 });
    await edit.getByTestId('account-excluded-toggle').click();
    await edit.getByRole('button', { name: /Anlegen|Übernehmen/ }).click();
    await expect(edit).toBeHidden({ timeout: 10_000 });

    await openBurndown(page);
    await expect(
      burndownPage(page).getByTestId('burndown-balance')
    ).toContainText(/^\s*0,00/);
  });
});
