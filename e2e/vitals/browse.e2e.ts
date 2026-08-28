/* ─── why ─────────────────────────────────────────────────────────
 * The browse tree holds no state and reads no profile, so what is worth
 * proving here is only what jsdom cannot: that a cold deep link resolves,
 * that stepping wraps rather than dead-ends, and that a number outside the
 * sixty-four is a page saying so instead of a blank one.
 *
 * `currentPage` exists because stepping between two hexagrams navigates
 * WITHIN one page component: Ionic mounts the arriving instance while still
 * holding the outgoing one for the back-swipe stack, so the selector matches
 * twice and only the last match is the page under test. Every other spec in
 * this suite moves between different components and never sees it.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import { gotoPage, pageRoot } from '../helpers';

const currentPage = (page: Page, selector: string): Locator =>
  pageRoot(page, selector).last();

const BROWSE_PAGE = 'app-page-vitals-browse';
const ZODIAC_PAGE = 'app-page-vitals-browse-zodiac';
const SIGN_PAGE = 'app-page-vitals-browse-sign';
const ICHING_PAGE = 'app-page-vitals-browse-iching';
const HEXAGRAM_PAGE = 'app-page-vitals-browse-hexagram';
const KI_PAGE = 'app-page-vitals-browse-ki';
const LIFE_PAGE = 'app-page-vitals-browse-life';

test.describe('BIOMON · browse', () => {
  test('reaches a sign from the table of contents', async ({ page }) => {
    await gotoPage(page, 'vitals/browse', BROWSE_PAGE);

    await pageRoot(page, BROWSE_PAGE)
      .getByTestId('vitals-browse-sections')
      .getByRole('link', { name: /Tierkreis/ })
      .click();

    const zodiac = pageRoot(page, ZODIAC_PAGE);
    await expect(zodiac).toBeVisible({ timeout: 15_000 });
    await expect(
      zodiac.getByTestId('vitals-browse-zodiac-list').getByRole('link')
    ).toHaveCount(12);

    await zodiac.getByRole('link', { name: /Skorpion/ }).click();

    const sign = pageRoot(page, SIGN_PAGE);
    await expect(sign.getByTestId('vitals-browse-sign')).toContainText(
      'Skorpion'
    );
    await expect(page).toHaveURL(/vitals\/browse\/zodiac\/scorpio/);
  });

  test('steps through the zodiac and wraps at the end', async ({ page }) => {
    await gotoPage(page, 'vitals/browse/zodiac/capricorn', SIGN_PAGE);

    const sign = pageRoot(page, SIGN_PAGE);
    await expect(sign.locator('h1')).toHaveText('Steinbock');

    await sign.getByTestId('vitals-browse-step-next').click();

    await expect(page).toHaveURL(/vitals\/browse\/zodiac\/aquarius/);
    await expect(currentPage(page, SIGN_PAGE).locator('h1')).toHaveText(
      'Wassermann'
    );
  });

  test('returns to the index from a sign', async ({ page }) => {
    await gotoPage(page, 'vitals/browse/zodiac/aries', SIGN_PAGE);

    await pageRoot(page, SIGN_PAGE)
      .getByRole('link', { name: 'Tierkreis' })
      .click();

    await expect(pageRoot(page, ZODIAC_PAGE)).toBeVisible({ timeout: 15_000 });
  });

  test('opens a hexagram by number and wraps backwards off the first', async ({
    page,
  }) => {
    await gotoPage(page, 'vitals/browse/iching', ICHING_PAGE);
    await expect(
      pageRoot(page, ICHING_PAGE)
        .getByTestId('vitals-browse-iching-list')
        .getByRole('link')
    ).toHaveCount(64);

    await page.goto('/#/vitals/browse/iching/1');

    const hexagram = pageRoot(page, HEXAGRAM_PAGE);
    await expect(hexagram).toBeVisible({ timeout: 15_000 });
    await expect(hexagram.getByTestId('vitals-browse-hexagram')).toContainText(
      'Nr. 1'
    );

    await hexagram.getByTestId('vitals-browse-step-previous').click();

    await expect(page).toHaveURL(/vitals\/browse\/iching\/64/);
    await expect(
      currentPage(page, HEXAGRAM_PAGE).getByTestId('vitals-browse-hexagram')
    ).toContainText('Nr. 64');
  });

  test('says so when the number names no hexagram', async ({ page }) => {
    await gotoPage(page, 'vitals/browse/iching/99', HEXAGRAM_PAGE);

    const hexagram = pageRoot(page, HEXAGRAM_PAGE);
    await expect(hexagram.getByTestId('vitals-browse-hexagram')).toHaveCount(0);
    await expect(hexagram.getByText('Kein solches Hexagramm')).toBeVisible();
  });

  test('lists the nine Ki stars and the nine life numbers', async ({
    page,
  }) => {
    await gotoPage(page, 'vitals/browse/ki', KI_PAGE);
    await expect(
      pageRoot(page, KI_PAGE).getByTestId('vitals-browse-ki-list').locator('li')
    ).toHaveCount(9);

    await gotoPage(page, 'vitals/browse/life', LIFE_PAGE);
    await expect(
      pageRoot(page, LIFE_PAGE)
        .getByTestId('vitals-browse-life-list')
        .locator('li')
    ).toHaveCount(9);
  });
});
