/* ─── why ─────────────────────────────────────────────────────────
 * The tray settles ~900 ms after a throw and only then paints its total,
 * so every assertion about a result waits on `dice-total` rather than on
 * the click — a throw asserted synchronously reads the scramble.
 *
 * The pool is persisted, so each spec clears it before it builds one:
 * the previous spec in the same worker leaves its dice behind.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { gotoPage, pageRoot } from './helpers';

const PAGE = 'app-page-trackplay-dice';

async function openDicePage(page: Page) {
  await gotoPage(page, 'trackplay/dice', PAGE);
  const dice = pageRoot(page, PAGE);
  if (await dice.getByTestId('dice-row').count()) {
    await dice.getByTestId('dice-clear').click();
    await expect(dice.getByTestId('dice-row')).toHaveCount(0);
  }
  return dice;
}

test.describe('trackplay dice', () => {
  test('starts empty and cannot be thrown', async ({ page }) => {
    const dice = await openDicePage(page);

    await expect(dice.getByTestId('dice-row')).toHaveCount(0);
    await expect(dice.getByTestId('dice-throw')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('adds dice of two types to one throw setup', async ({ page }) => {
    const dice = await openDicePage(page);

    await dice.getByTestId('dice-add').click();
    await dice.getByTestId('dice-add').click();

    await expect(dice.getByTestId('dice-row')).toHaveCount(2);
    await expect(dice.getByTestId('dice-notation')).toContainText('1W6');
    await expect(dice.getByTestId('dice-throw')).not.toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('throws one die per counted die and totals them', async ({ page }) => {
    const dice = await openDicePage(page);
    await dice.getByTestId('dice-add').click();
    const count = dice.getByTestId('dice-row-count').locator('input');
    await count.fill('3');
    await count.blur();
    await expect(dice.getByTestId('dice-notation')).toContainText('3W6');

    await dice.getByTestId('dice-throw').click();

    const total = dice.getByTestId('dice-total');
    await expect(total).toBeVisible({ timeout: 15_000 });
    const printed = await dice.getByTestId('dice-breakdown').textContent();
    const values = (printed ?? '')
      .split('+')
      .map((part) => Number.parseInt(part.trim(), 10));

    expect(values).toHaveLength(3);
    expect(values.every((value) => value >= 1 && value <= 6)).toBe(true);
    await expect(total).toHaveText(
      String(values.reduce((sum, value) => sum + value, 0))
    );
  });

  test('keeps the pool across a reload and drops the throw', async ({
    page,
  }) => {
    const dice = await openDicePage(page);
    await dice.getByTestId('dice-add').click();
    await dice.getByTestId('dice-throw').click();
    await expect(dice.getByTestId('dice-total')).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();
    const reloaded = pageRoot(page, PAGE);

    await expect(reloaded.getByTestId('dice-row')).toHaveCount(1);
    await expect(reloaded.getByTestId('dice-total')).toHaveCount(0);
  });
});
