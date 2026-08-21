/* ─── why ─────────────────────────────────────────────────────────
 * The uncategorized share is the cashboard's trust metric: it says how much
 * of the "where did it go" answer is actually answered. A unit spec proves
 * the arithmetic, so what is left for a browser is that filing a booking
 * MOVES it — the figure has to fall when a category is assigned, which
 * exercises the whole dispatch-to-selector path rather than the projector.
 *
 * Filing happens on `/cash/uncategorized`, reached by tapping the figure
 * itself: the triage list, the dialog it opens and the figure that falls are
 * three surfaces over one window, and the window is a facade signal no unit
 * spec can route through.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import { listRow, pageRoot, presentedDialog } from '../helpers';

function accounts(page: Page): Locator {
  return pageRoot(page, 'app-page-cash');
}

function account(page: Page): Locator {
  return pageRoot(page, 'app-page-cash-account');
}

function report(page: Page): Locator {
  return pageRoot(page, 'app-page-cash-report');
}

function unfiled(page: Page): Locator {
  return pageRoot(page, 'app-page-cash-uncategorized');
}

function modal(page: Page): Locator {
  return page.locator('ion-modal.show-modal');
}

async function seedExpense(page: Page) {
  await page.goto('/#/cash');
  await expect(accounts(page)).toBeVisible({ timeout: 30_000 });
  await accounts(page).getByTestId('page-header-add').click();
  const accountModal = presentedDialog(page, 'Neuen Eintrag anlegen');
  await accountModal
    .getByRole('textbox', { name: 'Name' })
    .fill('CREDSTICK-01');
  await accountModal.getByRole('button', { name: 'Anlegen' }).click();

  await listRow(page, 'CREDSTICK-01').click();
  await expect(account(page)).toBeVisible({ timeout: 10_000 });

  await account(page).getByTestId('page-header-add').click();
  await modal(page)
    .getByRole('textbox', { name: 'Name' })
    .fill('Soykaf refill');
  await modal(page).locator('app-money-input input').fill('12,34');
  await modal(page)
    .getByRole('button', { name: /Anlegen|Übernehmen/ })
    .click();
  await expect(modal(page)).toBeHidden({ timeout: 10_000 });
}

test.describe('cashboard trust metric', () => {
  test('reports every unfiled expense, and forgets it once filed', async ({
    page,
  }) => {
    await seedExpense(page);

    await page.goto('/#/cash/report');
    await expect(report(page)).toBeVisible({ timeout: 10_000 });
    await expect(report(page).getByTestId('report-scope')).toBeVisible();
    await expect(
      report(page).getByTestId('report-uncategorized')
    ).toContainText('100%');

    await report(page).getByTestId('report-uncategorized').click();
    await expect(unfiled(page)).toBeVisible({ timeout: 10_000 });
    await expect(
      unfiled(page).getByTestId('uncategorized-total')
    ).toContainText('12,34');
    await expect(unfiled(page).getByTestId('uncategorized-row')).toHaveCount(1);

    await unfiled(page).getByTestId('uncategorized-row').click();
    await expect(modal(page)).toBeVisible({ timeout: 10_000 });
    await modal(page).getByTestId('category-input-trigger').click();
    const search = page.getByTestId('category-picker-search').locator('input');
    await expect(search).toBeVisible({ timeout: 10_000 });
    await search.fill('Verpflegung');
    const create = page.getByText('Verpflegung erstellen');
    await expect(create).toBeVisible({ timeout: 10_000 });
    await create.click();
    await modal(page)
      .getByRole('button', { name: /Anlegen|Übernehmen/ })
      .click();
    await expect(modal(page)).toBeHidden({ timeout: 10_000 });

    await expect(unfiled(page).getByTestId('uncategorized-row')).toHaveCount(0);

    await page.goto('/#/cash/report');
    await expect(
      report(page).getByTestId('report-uncategorized')
    ).toContainText('0%');
  });
});
