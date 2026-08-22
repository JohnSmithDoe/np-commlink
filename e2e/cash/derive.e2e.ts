/* ─── why ─────────────────────────────────────────────────────────
 * Three things here are only true in a browser. The derive button lives in
 * one dialog and opens another through a service that holds ONE request, so
 * the first has to close itself — a unit spec asserting the dispatch would
 * pass with both mounted. The seeded rule then arrives through the SAME
 * `linkedSignal` a blank one does, and only a rendered form shows the
 * condition it was seeded with. And the rule fires without anybody pressing
 * apply, which is an effect, not a return value.
 *
 * The booking is created and REOPENED, because the buttons appear only for a
 * booking that already exists: deriving commits what is on screen, and there
 * is nothing to commit while the row is still a draft.
 *
 * The last test asserts DOCUMENT ORDER, which is unusual and deliberate: an
 * `@for`/`@empty` pair that has rendered its empty branch inserts the first
 * item view at the block's leading anchor, so the chip landed BEFORE the
 * label it belongs to. Only the second derive in one dialog instance shows
 * it, which is why the flow opens the picker twice.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import { pageRoot, presentedDialog, waitForPersisted } from '../helpers';

function dialog(page: Page): Locator {
  return page.locator('ion-modal.show-modal');
}

async function createAccountWithBooking(page: Page) {
  await page.goto('/#/cash');
  const accounts = pageRoot(page, 'app-page-cash');
  await expect(accounts).toBeVisible({ timeout: 30_000 });

  await accounts.getByTestId('page-header-add').click();
  const accountModal = presentedDialog(page, 'Neuen Eintrag anlegen');
  await accountModal
    .getByRole('textbox', { name: 'Name' })
    .fill('CREDSTICK-01');
  await accountModal.getByRole('button', { name: 'Anlegen' }).click();
  await expect(dialog(page)).toBeHidden({ timeout: 10_000 });

  await accounts.getByText('CREDSTICK-01').click();
  const account = pageRoot(page, 'app-page-cash-account');
  await expect(account).toBeVisible({ timeout: 10_000 });

  await account.getByTestId('page-header-add').click();
  const txnModal = presentedDialog(page, 'Neuen Eintrag anlegen');
  await txnModal
    .getByRole('textbox', { name: 'Name' })
    .fill('Soykaf refill 42');
  await txnModal.getByRole('textbox', { name: 'Betrag' }).fill('4,20');
  await txnModal.getByRole('button', { name: 'Anlegen' }).click();
  await expect(dialog(page)).toBeHidden({ timeout: 10_000 });

  await expect(account.getByText('Soykaf refill 42')).toBeVisible({
    timeout: 10_000,
  });
  return account;
}

async function assignNewCategory(page: Page, modal: Locator, name: string) {
  await modal.getByTestId('category-input-trigger').click();
  const search = page.getByTestId('category-picker-search').locator('input');
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill(name);
  const create = page.getByText(`${name} erstellen`);
  await expect(create).toBeVisible({ timeout: 10_000 });
  await create.click();
  await expect(modal.locator('app-category-input').getByText(name)).toBeVisible(
    { timeout: 10_000 }
  );
}

test.describe('deriving a rule from a booking', () => {
  test('seeds the rule, previews what it catches, and files the ledger', async ({
    page,
  }) => {
    const account = await createAccountWithBooking(page);

    await account.getByTestId('list-row-select').first().click();
    await expect(dialog(page)).toBeVisible({ timeout: 10_000 });

    await dialog(page).getByTestId('derive-rule').click();

    const rule = presentedDialog(page, 'Neuen Eintrag anlegen');
    await expect(dialog(page)).toHaveCount(1, { timeout: 10_000 });
    await expect(rule.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Soykaf'
    );
    await expect(
      rule.getByTestId('condition-value').locator('input')
    ).toHaveValue('Soykaf');
    await expect(rule.getByTestId('match-preview')).toContainText(
      'Trifft auf 1 von 1'
    );

    await assignNewCategory(page, rule, 'Kaffee');
    await rule.getByRole('button', { name: /Anlegen|Übernehmen/ }).click();
    await expect(dialog(page)).toBeHidden({ timeout: 10_000 });

    await expect(
      account.getByTestId('list-row-category').first()
    ).toContainText('Kaffee', { timeout: 10_000 });
    await waitForPersisted(page, 'cash', 'Kaffee');

    await page.goto('/#/cash/rules');
    const rules = pageRoot(page, 'app-page-cash-rules');
    await expect(rules).toBeVisible({ timeout: 30_000 });
    await expect(rules.getByTestId('cash-rule-stat')).toContainText(
      'greift bei 1'
    );
  });

  test('seeds a fixed cost with the amount the booking carried', async ({
    page,
  }) => {
    const account = await createAccountWithBooking(page);

    await account.getByTestId('list-row-select').first().click();
    await expect(dialog(page)).toBeVisible({ timeout: 10_000 });

    await dialog(page).getByTestId('derive-schedule').click();

    const schedule = presentedDialog(page, 'Neuen Eintrag anlegen');
    await expect(schedule.locator('app-money-input input')).toHaveValue('4,20');
    await expect(
      schedule.getByTestId('condition-value').locator('input')
    ).toHaveValue('Soykaf');
  });

  test('keeps the category chip behind its label on a second derive', async ({
    page,
  }) => {
    const account = await createAccountWithBooking(page);

    await account.getByTestId('list-row-select').first().click();
    await expect(dialog(page)).toBeVisible({ timeout: 10_000 });
    await dialog(page).getByTestId('derive-rule').click();

    const empty = presentedDialog(page, 'Neuen Eintrag anlegen');
    await expect(empty.getByTestId('category-input-trigger')).toBeVisible({
      timeout: 10_000,
    });
    await empty.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(dialog(page)).toBeHidden({ timeout: 10_000 });

    await account.getByTestId('list-row-select').first().click();
    await expect(dialog(page)).toBeVisible({ timeout: 10_000 });
    await assignNewCategory(page, dialog(page), 'Kaffee');
    await dialog(page).getByTestId('derive-rule').click();

    const rule = presentedDialog(page, 'Neuen Eintrag anlegen');
    const trigger = rule.getByTestId('category-input-trigger');
    await expect(trigger.locator('ion-chip')).toBeVisible({ timeout: 10_000 });

    const chipFollowsLabel = await trigger.evaluate((item) => {
      const label = item.querySelector('ion-label > span');
      const chip = item.querySelector('ion-chip');
      if (!label || !chip) return false;
      return !!(
        label.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING
      );
    });
    expect(chipFollowsLabel).toBe(true);
  });
});
