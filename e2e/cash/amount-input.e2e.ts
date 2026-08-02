/* ─── why ─────────────────────────────────────────────────────────
 * `app-money-input` is a Signal Forms control over integer cents: the
 * dialog holds `amountCents` and the control alone knows about the de-DE
 * text in the box. Two of its behaviours only a real browser shows.
 *
 * It must not reformat while someone is still typing — halfway through
 * `12,` the model is already 1200, and writing that back would move the
 * caret on every keystroke.
 *
 * It must reformat when the draft reseeds, which is the only moment it
 * writes the box at all: reopening a stored expense turns -1234 into the
 * magnitude `12,34`, the sign being the dialog's business rather than the
 * control's.
 *
 * The two rejections in between are different rules wearing one message:
 * `12,3x` does not parse, while `0` parses and is then refused by
 * `min(path.amountCents, 1)`.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import { pageRoot } from '../helpers';

function accounts(page: Page): Locator {
  return pageRoot(page, 'app-page-cash');
}

function account(page: Page): Locator {
  return pageRoot(page, 'app-page-cash-account');
}

function txnModal(page: Page): Locator {
  return page.locator('app-cash-transaction-edit-modal');
}

function amountBox(page: Page): Locator {
  return txnModal(page).locator('app-money-input input');
}

async function openLedger(page: Page) {
  await page.goto('/#/cash');
  await expect(accounts(page)).toBeVisible({ timeout: 30_000 });
  await accounts(page).getByTestId('page-header-add').click();
  const accountModal = page.locator('app-cash-account-edit-modal');
  await accountModal
    .getByRole('textbox', { name: 'Name' })
    .fill('CREDSTICK-01');
  await accountModal.getByRole('button', { name: 'Speichern' }).click();
  await accounts(page).getByText('CREDSTICK-01').click();
  await expect(account(page)).toBeVisible({ timeout: 10_000 });
}

test.describe('cash money input', () => {
  test('edits cents without fighting the typist', async ({ page }) => {
    await openLedger(page);
    await account(page)
      .getByRole('button', { name: 'Transaktion hinzufügen' })
      .click();
    await txnModal(page)
      .getByRole('textbox', { name: 'Beschreibung' })
      .fill('Soykaf refill');

    const save = txnModal(page).getByRole('button', { name: 'Speichern' });
    const note = txnModal(page).getByText('Ungültiger Betrag');

    await amountBox(page).fill('12,');
    await expect(amountBox(page)).toHaveValue('12,');
    await expect(save).toBeEnabled();

    await amountBox(page).fill('12,3x');
    await expect(note).toBeVisible({ timeout: 10_000 });
    await expect(save).toBeDisabled();

    await amountBox(page).fill('0');
    await expect(note).toBeVisible();
    await expect(save).toBeDisabled();

    await amountBox(page).fill('12,34');
    await expect(note).toBeHidden();
    await save.click();
    await expect(account(page).getByText('Soykaf refill')).toBeVisible({
      timeout: 10_000,
    });

    await account(page).getByText('Soykaf refill').click();
    await expect(txnModal(page)).toBeVisible({ timeout: 10_000 });
    await expect(amountBox(page)).toHaveValue('12,34');
  });
});
