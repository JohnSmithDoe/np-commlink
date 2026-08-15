/* ─── why ─────────────────────────────────────────────────────────
 * The write half of the lazy cash context, opposite `first-paint.e2e.ts`:
 * create an account and a transaction through the real dialogs, then boot
 * cold and read both back.
 *
 * What it guards is silent data loss, not a red screen. On re-entry the
 * route registers the slice at empty `initialState` and the resolver
 * dispatches `[Cash] load` — if the save effect does not exclude that
 * action it writes the empty slice over the saved ledger before the load
 * effect ever reads it. The same bug bit [Tasks] and [Trackplay], which
 * is why each of those carries a reload spec too.
 * ───────────────────────────────────────────────────────────────── */

import { expect, test } from '@playwright/test';
import { pageRoot, waitForPersisted, presentedDialog } from '../helpers';

test.describe('cash persistence', () => {
  test('keeps a created account + transaction across a full reload', async ({
    page,
  }) => {
    await page.goto('/#/cash');
    const list = pageRoot(page, 'app-page-cash');
    await expect(list).toBeVisible({ timeout: 30_000 });
    await expect(
      list.locator('app-item-list-empty app-text-item')
    ).toBeVisible(); // hydrated, empty

    await list.getByTestId('page-header-add').click();
    const accountModal = presentedDialog(page, 'Neuen Eintrag anlegen');
    await accountModal
      .getByRole('textbox', { name: 'Name' })
      .fill('CREDSTICK-01');
    await accountModal.getByRole('button', { name: 'Anlegen' }).click();

    await expect(list.getByText('CREDSTICK-01')).toBeVisible({
      timeout: 10_000,
    });

    await list.getByText('CREDSTICK-01').click();
    const account = pageRoot(page, 'app-page-cash-account');
    await expect(account).toBeVisible({ timeout: 10_000 });

    await account.getByTestId('page-header-add').click();
    const txnModal = presentedDialog(page, 'Neuen Eintrag anlegen');
    await txnModal.getByRole('textbox', { name: 'Name' }).fill('Soykaf refill');
    await txnModal.getByRole('textbox', { name: 'Betrag' }).fill('12,34');
    await txnModal.getByRole('button', { name: 'Anlegen' }).click();

    await expect(account.getByText('Soykaf refill')).toBeVisible({
      timeout: 10_000,
    });
    await waitForPersisted(page, 'cash', 'Soykaf refill');

    await page.reload();

    const accountAfter = pageRoot(page, 'app-page-cash-account');
    await expect(accountAfter.getByText('Soykaf refill')).toBeVisible({
      timeout: 30_000,
    });
  });
});
