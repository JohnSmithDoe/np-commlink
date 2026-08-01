import { expect, Locator, Page, test } from '@playwright/test';
import { pageRoot } from '../helpers';

/**
 * `app-money-input` is a Signal Forms control over integer **cents**: the dialog
 * holds `amountCents`, and the control alone knows about the de-DE text in the
 * box. Two behaviours only a real browser shows — the box must NOT reformat
 * itself while someone is still typing, and it MUST reformat from cents when the
 * draft reseeds (reopening a stored transaction).
 */

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

    // Halfway through "12," the model is already 1200 — the box must still read
    // what was typed, or the caret would jump on every keystroke.
    await amountBox(page).fill('12,');
    await expect(amountBox(page)).toHaveValue('12,');
    await expect(save).toBeEnabled();

    // Junk keeps the last amount that parsed, and says so.
    await amountBox(page).fill('12,3x');
    await expect(note).toBeVisible({ timeout: 10_000 });
    await expect(save).toBeDisabled();

    // Zero is not junk, but `min(path.amountCents, 1)` rejects it all the same.
    await amountBox(page).fill('0');
    await expect(note).toBeVisible();
    await expect(save).toBeDisabled();

    await amountBox(page).fill('12,34');
    await expect(note).toBeHidden();
    await save.click();
    await expect(account(page).getByText('Soykaf refill')).toBeVisible({
      timeout: 10_000,
    });

    // Reopening reseeds the draft from stored cents, which IS the moment the
    // control formats: -1234 → the magnitude '12,34'.
    await account(page).getByText('Soykaf refill').click();
    await expect(txnModal(page)).toBeVisible({ timeout: 10_000 });
    await expect(amountBox(page)).toHaveValue('12,34');
  });
});
