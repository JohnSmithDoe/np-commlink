/* ─── why ─────────────────────────────────────────────────────────
 * The reload assertion is the point of this file. COPROCESSOR is the first
 * program in the app that persists nothing, and every other module's suite
 * defends the opposite property — so a slice quietly added here would pass
 * every other gate and only fail this one.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { gotoPage, mainContent, moduleTab, pageRoot } from '../helpers';

const escapeForRegExp = (text: string): string =>
  text.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`);

const CALC_PAGE = 'app-page-coprocessor-calc';
const UNITS_PAGE = 'app-page-coprocessor-units';
const GOLDEN_PAGE = 'app-page-coprocessor-golden';

const tabBar = (page: Page) =>
  mainContent(page).getByTestId('module-tabs').first();

const tab = (page: Page, name: string) => moduleTab(page, name);

const key = (page: Page, glyph: string) =>
  page
    .getByTestId('coprocessor-keypad')
    .getByTestId('coprocessor-key')
    .filter({
      hasText: new RegExp(String.raw`^\s*${escapeForRegExp(glyph)}\s*$`),
    });

test.describe('coprocessor', () => {
  test('opens the calculator from the module root and shows three tabs', async ({
    page,
  }) => {
    await gotoPage(page, 'coprocessor', CALC_PAGE);

    await expect(page).toHaveURL(/#\/coprocessor\/calc$/);
    await expect(tabBar(page).locator('ion-tab-button')).toHaveCount(3);

    await tab(page, 'units').click();
    await expect(pageRoot(page, UNITS_PAGE)).toBeVisible({ timeout: 15_000 });

    await tab(page, 'golden').click();
    await expect(pageRoot(page, GOLDEN_PAGE)).toBeVisible({ timeout: 15_000 });
  });

  test('evaluates an expression with precedence and brackets', async ({
    page,
  }) => {
    await gotoPage(page, 'coprocessor/calc', CALC_PAGE);

    for (const glyph of ['1', '2', '×', '(', '3', '+', '4', ')', '÷', '2']) {
      await key(page, glyph).click();
    }

    await expect(page.getByTestId('coprocessor-result')).toContainText('42');
  });

  test('converts a foreign unit into a metric one', async ({ page }) => {
    await gotoPage(page, 'coprocessor/units', UNITS_PAGE);

    await expect(page.getByTestId('coprocessor-units-result')).toContainText(
      '1,609'
    );

    await page
      .getByTestId('coprocessor-units-amount')
      .locator('input')
      .fill('26,2');
    await expect(page.getByTestId('coprocessor-units-result')).toContainText(
      '42'
    );

    await page.getByTestId('coprocessor-units-swap').click();
    await expect(page.getByTestId('coprocessor-units-result')).toContainText(
      '16,2'
    );
  });

  test('opens each quantity on a pair worth converting', async ({ page }) => {
    await gotoPage(page, 'coprocessor/units', UNITS_PAGE);

    await page.getByTestId('coprocessor-units-quantity').click();
    await page.getByRole('radio', { name: 'Temperatur' }).click();
    await page.getByRole('button', { name: 'OK' }).click();

    await expect(page.getByTestId('coprocessor-units-result')).toContainText(
      '-17,2'
    );
  });

  test('turns a magnitude into figures with an anchor', async ({ page }) => {
    await gotoPage(page, 'coprocessor/units', UNITS_PAGE);

    await page.getByTestId('coprocessor-units-mode').getByText('Geld').click();

    await expect(page.getByTestId('coprocessor-money-echo')).toContainText(
      '1 Million Euro'
    );

    const rows = page.getByTestId('coprocessor-money-row');
    await expect(rows).toHaveCount(12);
    await expect(
      page.getByTestId('coprocessor-money-anchor').first()
    ).toBeVisible();

    await page
      .getByTestId('coprocessor-money-amount')
      .locator('input')
      .fill('2,5');
    await expect(page.getByTestId('coprocessor-money-echo')).toContainText(
      '2,5 Millionen Euro'
    );
    await expect(page.getByTestId('coprocessor-money-echo')).toContainText(
      '2.500.000'
    );

    await page.getByTestId('coprocessor-money-chip').nth(4).click();
    await expect(page.getByTestId('coprocessor-money-echo')).toContainText(
      'Billion'
    );
  });

  test('walks the magnitude by a decade in each direction', async ({
    page,
  }) => {
    await gotoPage(page, 'coprocessor/units', UNITS_PAGE);
    await page.getByTestId('coprocessor-units-mode').getByText('Geld').click();

    await page.getByTestId('coprocessor-money-up').click();
    await expect(page.getByTestId('coprocessor-money-echo')).toContainText(
      '10 Millionen'
    );

    await page.getByTestId('coprocessor-money-down').click();
    await expect(page.getByTestId('coprocessor-money-echo')).toContainText(
      '1 Million'
    );
  });

  test('splits a length and draws the spiral', async ({ page }) => {
    await gotoPage(page, 'coprocessor/golden', GOLDEN_PAGE);

    await expect(page.getByTestId('coprocessor-golden-major')).toContainText(
      '61,8034'
    );
    await expect(page.getByTestId('coprocessor-golden-minor')).toContainText(
      '38,1966'
    );

    await page
      .getByTestId('coprocessor-golden-total')
      .locator('input')
      .fill('1920');
    await expect(page.getByTestId('coprocessor-golden-major')).toContainText(
      '1.186,6'
    );

    await expect(
      page.getByTestId('coprocessor-golden-ladder').locator('li')
    ).toHaveCount(22);
  });

  test('marks the golden points of an area and measures the chosen one', async ({
    page,
  }) => {
    await gotoPage(page, 'coprocessor/golden', GOLDEN_PAGE);
    await page
      .getByTestId('coprocessor-golden-view')
      .getByText('Fläche')
      .click();

    await expect(page.getByTestId('coprocessor-golden-area')).toBeVisible();
    await expect(page.getByTestId('coprocessor-golden-point')).toHaveCount(4);

    const measures = page.getByTestId('coprocessor-golden-measures');
    await expect(measures).toContainText('114,59');
    await expect(measures).toContainText('185,41');
    await expect(page.getByTestId('coprocessor-golden-x')).toContainText(
      '114,59'
    );
    await expect(page.getByTestId('coprocessor-golden-y')).toContainText(
      '148,3'
    );

    await page.getByTestId('coprocessor-golden-point').nth(1).click();
    await expect(page.getByTestId('coprocessor-golden-y')).toContainText(
      '91,6'
    );

    await page
      .getByTestId('coprocessor-golden-depth')
      .getByText('Stufe 2')
      .click();
    await expect(page.getByTestId('coprocessor-golden-point')).toHaveCount(64);

    await page.getByTestId('coprocessor-golden-point').nth(20).click();
    await expect(page.getByTestId('coprocessor-golden-y')).toBeVisible();

    await page.getByTestId('coprocessor-golden-swap').click();
    await expect(
      page.getByTestId('coprocessor-golden-width').locator('input')
    ).toHaveValue('240');
    await expect(
      page.getByTestId('coprocessor-golden-height').locator('input')
    ).toHaveValue('300');
  });

  test('keeps nothing across a reload', async ({ page }) => {
    await gotoPage(page, 'coprocessor/calc', CALC_PAGE);

    for (const glyph of ['4', '2']) await key(page, glyph).click();
    await expect(page.getByTestId('coprocessor-result')).toContainText('42');

    await page.reload();
    await expect(pageRoot(page, CALC_PAGE)).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByTestId('coprocessor-expression').locator('input')
    ).toHaveValue('');
  });
});
