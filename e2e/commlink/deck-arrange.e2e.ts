/* ─── why ─────────────────────────────────────────────────────────
 * A tile IS a link, so the move controls are the arrange mode's whole
 * point: they are the only way to change the order without a drag that
 * would compete with the tap that opens a program. Both halves are
 * asserted — that the controls are absent until armed, and that a move
 * survives a reload, since the order lands in the same stored document
 * the visible set does.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { enableDeckProgram, waitForPersisted } from '../helpers';

const deck = (page: Page) => page.locator('app-page-commlink');
const codenames = (page: Page) =>
  deck(page).getByTestId('deck-tile').getByTestId('deck-tile-name');

async function openDeck(page: Page): Promise<void> {
  await page.goto('/#/commlink');
  await expect(deck(page).getByTestId('deck-status-strip')).toBeVisible({
    timeout: 30_000,
  });
}

test.describe('deck arrange', () => {
  test.beforeEach(async ({ page }) => {
    await enableDeckProgram(page, 'MARKET', 'shopping');
    await enableDeckProgram(page, 'AGENDA', 'tasks');
  });

  test('hides the move controls until arrange is armed', async ({ page }) => {
    await openDeck(page);

    await expect(deck(page).getByTestId('deck-move-later')).toHaveCount(0);

    await deck(page).getByTestId('deck-arrange').click();

    await expect(deck(page).getByTestId('deck-move-later')).toHaveCount(2);
  });

  test('moves a program one slot and keeps it there across a reload', async ({
    page,
  }) => {
    await openDeck(page);
    const before = await codenames(page).allInnerTexts();
    expect(before.length).toBe(2);

    await deck(page).getByTestId('deck-arrange').click();
    await deck(page).getByTestId('deck-move-later').first().click();
    await waitForPersisted(page, 'deck', '"order"');

    const swapped = before.toReversed();
    await expect(codenames(page)).toHaveText(swapped);

    await page.reload();
    await expect(codenames(page)).toHaveText(swapped);
  });
});
