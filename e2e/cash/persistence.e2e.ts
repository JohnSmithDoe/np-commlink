import { expect, test } from '@playwright/test';
import { waitForPersisted } from '../helpers';

/**
 * Mutate → reload persistence guard for the LAZY cash context (the parity guard
 * `e2e/cash/first-paint.e2e.ts` flagged as outstanding). It drives the full
 * CREDSTICK write path through the UI — create an account, add a manual
 * transaction — then does a cold reload and asserts both survive.
 *
 * This exercises CashSaveEffects end-to-end: a returning user re-entering
 * `/cash/:accountId` after a full boot must read back the account + transaction
 * from IndexedDB. The route's `[Cash] load` fires at empty initialState, so the
 * persist effect must ignore it (the data-loss bug that bit [Tasks]/[Cash]) and
 * the load effect must hydrate the real saved ledger before the page paints.
 */
test.describe('cash persistence', () => {
  test('keeps a created account + transaction across a full reload', async ({
    page,
  }) => {
    await page.goto('/#/cash');
    const list = page.locator('#main-content app-page-cash');
    await expect(list).toBeVisible({ timeout: 30_000 });
    await expect(list.locator('.cash-empty')).toBeVisible(); // hydrated, empty

    // --- create an account (name is the only required field) ---
    await list
      .locator('ion-button', { has: page.locator('ion-icon[name="add"]') })
      .click();
    const accountModal = page.locator('app-cash-account-edit-modal');
    await accountModal
      .getByRole('textbox', { name: 'Name' })
      .fill('CREDSTICK-01');
    await accountModal.getByRole('button', { name: 'Speichern' }).click();

    await expect(list.getByText('CREDSTICK-01')).toBeVisible({
      timeout: 10_000,
    });

    await list.getByText('CREDSTICK-01').click();
    const account = page.locator('#main-content app-page-cash-account');
    await expect(account).toBeVisible({ timeout: 10_000 });

    await account
      .getByRole('button', { name: 'Transaktion hinzufügen' })
      .click();
    const txnModal = page.locator('app-cash-transaction-edit-modal');
    await txnModal
      .getByRole('textbox', { name: 'Beschreibung' })
      .fill('Soykaf refill');
    await txnModal.getByRole('textbox', { name: 'Betrag' }).fill('12,34');
    await txnModal.getByRole('button', { name: 'Speichern' }).click();

    await expect(account.getByText('Soykaf refill')).toBeVisible({
      timeout: 10_000,
    });
    await waitForPersisted(page, 'cash', 'Soykaf refill');

    // --- cold reload → fresh boot → re-enter the lazy account route ---
    await page.reload();

    const accountAfter = page.locator('#main-content app-page-cash-account');
    await expect(accountAfter.getByText('Soykaf refill')).toBeVisible({
      timeout: 30_000,
    });
  });
});
