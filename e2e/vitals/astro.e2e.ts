/* ─── why ─────────────────────────────────────────────────────────
 * Both readouts are pure functions with their own unit specs, so what is
 * here is only what jsdom cannot show: that the date field seeds itself
 * from the stored profile across a real navigation, and that typing over
 * it re-derives everything without touching the profile.
 *
 * The panel headline is located as `h1` rather than by its text, because a
 * sign name also appears in the season timeline below it — today's
 * neighbours are two more sign names on the same page.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { pickSelectOption } from '../helpers';
import {
  createProfile,
  editDialog,
  gotoPage,
  openProfile,
  pageRoot,
  PROFILE_PAGE,
  PROFILES_PAGE,
} from './helpers';

const ZODIAC_PAGE = 'app-page-vitals-zodiac';
const ICHING_PAGE = 'app-page-vitals-iching';
const CAST_PAGE = 'app-page-vitals-iching-cast';

async function openProfileBornOn(page: Page, birthDate: string): Promise<void> {
  await gotoPage(page, 'vitals', PROFILES_PAGE);
  await createProfile(page, 'Martin');
  await openProfile(page, 'Martin');

  const profile = pageRoot(page, PROFILE_PAGE);
  await profile.getByRole('button', { name: 'Bearbeiten' }).click();

  const dialog = editDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await dialog
    .getByTestId('vitals-profile-birth-date')
    .locator('input')
    .fill(birthDate);
  await pickSelectOption(
    page,
    dialog.getByTestId('vitals-profile-ascendant'),
    'Steinbock'
  );
  await pickSelectOption(
    page,
    dialog.getByTestId('vitals-profile-sun'),
    'Löwe'
  );
  await dialog.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('BIOMON · astro', () => {
  test('seeds the zodiac page from the profile, then re-derives on a new date', async ({
    page,
  }) => {
    await openProfileBornOn(page, '1980-08-05');

    await pageRoot(page, PROFILE_PAGE)
      .getByTestId('vitals-zodiac-link')
      .click();
    const zodiac = pageRoot(page, ZODIAC_PAGE);
    await expect(zodiac).toBeVisible({ timeout: 15_000 });

    const zodiacDate = zodiac
      .getByTestId('vitals-zodiac-date')
      .locator('input');
    await expect(zodiacDate).toHaveValue('1980-08-05');
    await expect(zodiac.locator('h1')).toHaveText('Löwe');

    const ascendant = zodiac.locator('p').filter({ hasText: 'Aszendent' });
    await expect(ascendant).toContainText('Steinbock');

    await zodiacDate.fill('1990-03-25');

    await expect(zodiac.locator('h1')).toHaveText('Widder');
    await expect(ascendant).toContainText('nicht gesetzt');
  });

  test('maps a birthday to its Ki year number across the February turn', async ({
    page,
  }) => {
    await openProfileBornOn(page, '1980-08-05');

    await pageRoot(page, PROFILE_PAGE)
      .getByTestId('vitals-iching-link')
      .click();
    const iching = pageRoot(page, ICHING_PAGE);
    await expect(iching).toBeVisible({ timeout: 15_000 });

    await expect(iching.locator('h1')).toHaveText('2 · Erde');
    await expect(iching.getByText('Ki-Jahr 1980')).toBeVisible();

    await iching
      .getByTestId('vitals-iching-date')
      .locator('input')
      .fill('1980-02-03');

    await expect(iching.locator('h1')).toHaveText('3 · Donner');
    await expect(iching.getByText('Ki-Jahr 1979')).toBeVisible();
  });

  test('reads the life number off the whole date, beside the Ki star', async ({
    page,
  }) => {
    await openProfileBornOn(page, '1980-08-05');

    await pageRoot(page, PROFILE_PAGE)
      .getByTestId('vitals-iching-link')
      .click();
    const iching = pageRoot(page, ICHING_PAGE);
    await expect(iching).toBeVisible({ timeout: 15_000 });

    const life = iching
      .locator('section')
      .filter({ hasText: 'Lebenszahl' })
      .first();
    await expect(life).toContainText('Quersumme des Geburtsdatums: 31');
    await expect(life.locator('h2')).toHaveText('Das Fundament');
    await expect(iching.locator('h1')).toHaveText('2 · Erde');
  });

  test('throws six lines and lands on a hexagram', async ({ page }) => {
    await openProfileBornOn(page, '1980-08-05');

    await pageRoot(page, PROFILE_PAGE)
      .getByTestId('vitals-iching-link')
      .click();
    await pageRoot(page, ICHING_PAGE)
      .getByTestId('vitals-iching-cast-link')
      .click();

    const cast = pageRoot(page, CAST_PAGE);
    await expect(cast).toBeVisible({ timeout: 15_000 });
    await expect(cast.getByTestId('iching-cast-hexagram')).toHaveCount(0);

    const throwButton = cast.getByTestId('iching-cast-throw');
    for (let line = 1; line <= 6; line++) {
      await expect(cast.getByText(`Linie ${line - 1} von 6`)).toBeVisible();
      await throwButton.click();
    }

    await expect(cast.getByText('Linie 6 von 6')).toBeVisible();
    await expect(throwButton).toBeHidden();

    const hexagram = cast.getByTestId('iching-cast-hexagram');
    await expect(hexagram).toBeVisible();
    await expect(hexagram).toContainText(/Nr\. \d+/);
    await expect(hexagram.locator('h1')).not.toBeEmpty();
    await expect(cast.locator('.cast-line')).toHaveCount(6);

    await cast.getByTestId('iching-cast-reset').click();

    await expect(cast.getByTestId('iching-cast-hexagram')).toHaveCount(0);
    await expect(cast.getByText('Linie 0 von 6')).toBeVisible();
  });
});
