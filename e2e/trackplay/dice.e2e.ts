/* ─── why ─────────────────────────────────────────────────────────
 * The tray settles ~900 ms after a throw and only then paints its total,
 * so every assertion about a result waits on `dice-total` rather than on
 * the click — a throw asserted synchronously reads the scramble.
 *
 * The table is persisted, so each spec clears it before it lays one out:
 * the previous spec in the same worker leaves its dice behind.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import { gotoPage, pageRoot } from './helpers';

const PAGE = 'app-page-trackplay-dice';

const table = (dice: Locator): Locator =>
  dice.getByTestId('dice-table').getByTestId('dice-die');

const bag = (dice: Locator): Locator =>
  dice.getByTestId('dice-bag').getByTestId('dice-die');

const tray = (dice: Locator): Locator =>
  dice.locator('app-trackplay-dice-tray app-trackplay-die-glyph');

async function openDicePage(page: Page): Promise<Locator> {
  await gotoPage(page, 'trackplay/dice', PAGE);
  const dice = pageRoot(page, PAGE);
  if (await table(dice).count()) {
    await dice.getByTestId('dice-clear').click();
    await expect(table(dice)).toHaveCount(0);
  }
  return dice;
}

test.describe('trackplay dice', () => {
  test('offers the whole bag over an empty table', async ({ page }) => {
    const dice = await openDicePage(page);

    await expect(bag(dice)).toHaveCount(7);
    await expect(table(dice)).toHaveCount(0);
    await expect(dice.getByTestId('dice-throw')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('lays one die per tap, and tallies equal ones into a term', async ({
    page,
  }) => {
    const dice = await openDicePage(page);

    await bag(dice).nth(1).click();
    await bag(dice).nth(1).click();
    await bag(dice).nth(1).click();
    await bag(dice).nth(5).click();

    await expect(table(dice)).toHaveCount(4);
    await expect(dice.getByTestId('dice-notation')).toContainText('3W6');
    await expect(dice.getByTestId('dice-notation')).toContainText('1W20');
  });

  test('takes a die back off the table when it is tapped', async ({ page }) => {
    const dice = await openDicePage(page);
    await bag(dice).nth(1).click();
    await bag(dice).nth(1).click();
    await expect(table(dice)).toHaveCount(2);

    await table(dice).first().click();

    await expect(table(dice)).toHaveCount(1);
    await expect(dice.getByTestId('dice-notation')).toContainText('1W6');
  });

  test('throws one die per die on the table and totals them', async ({
    page,
  }) => {
    const dice = await openDicePage(page);
    for (let taps = 0; taps < 3; taps++) await bag(dice).nth(1).click();
    await expect(table(dice)).toHaveCount(3);

    await dice.getByTestId('dice-throw').click();

    const total = dice.getByTestId('dice-total');
    await expect(total).toBeVisible({ timeout: 15_000 });
    const settled = await tray(dice).allTextContents();
    const values = settled.map((face) => Number.parseInt(face.trim(), 10));

    expect(values).toHaveLength(3);
    expect(values.every((value) => value >= 1 && value <= 6)).toBe(true);
    await expect(total).toHaveText(
      String(values.reduce((sum, value) => sum + value, 0))
    );
  });

  test('keeps the table across a reload and drops the throw', async ({
    page,
  }) => {
    const dice = await openDicePage(page);
    await bag(dice).nth(1).click();
    await dice.getByTestId('dice-throw').click();
    await expect(dice.getByTestId('dice-total')).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();
    const reloaded = pageRoot(page, PAGE);

    await expect(table(reloaded)).toHaveCount(1);
    await expect(reloaded.getByTestId('dice-total')).toHaveCount(0);
  });
});
