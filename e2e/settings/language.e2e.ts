/* ─── why ─────────────────────────────────────────────────────────
 * Switching the language RESTARTS the app — money, score and date render
 * through pure pipes that cache on input identity, and `LOCALE_ID` is a
 * provider that cannot be re-resolved — so the one thing worth proving is
 * that the choice survives a reload it triggers itself: the settings
 * write must win the race against that reload, and the `localStorage`
 * mirror `LOCALE_ID` reads at boot must already hold the new value. jsdom
 * has neither a reload nor a real IndexedDB, so none of it is observable
 * in a unit spec.
 *
 * There is deliberately no `page.reload()` after the switch: the English
 * heading is reachable ONLY through the restart the app performs itself.
 * The explicit reload that follows is a second, colder read — off disk
 * rather than out of the live store.
 *
 * German is the default, so a German heading is this file's "booted"
 * signal.
 *
 * The options are located by id because the page carries two segments,
 * theme and language, that `ion-segment-button` cannot tell apart. The
 * label still says WHICH option — a language's own name is deliberately
 * untranslated, so it is stable in either bundle.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';

const settingsPage = (page: Page) => page.locator('app-page-settings');

const heading = (page: Page, text: string) =>
  settingsPage(page).getByText(text, { exact: true });

async function openSettings(page: Page): Promise<void> {
  await page.goto('/#/settings');
  await page.reload();
  await expect(heading(page, 'Darstellung')).toBeVisible({ timeout: 30_000 });
}

async function pickLanguage(page: Page, label: string): Promise<void> {
  await settingsPage(page)
    .getByTestId('language-option')
    .filter({ hasText: label })
    .click();
}

test.describe('language switch', () => {
  test('switches to English and survives the restart it triggers', async ({
    page,
  }) => {
    await openSettings(page);

    await pickLanguage(page, 'English');

    await expect(heading(page, 'Appearance')).toBeVisible({ timeout: 30_000 });
    await expect(heading(page, 'Language')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.reload();
    await expect(heading(page, 'Appearance')).toBeVisible({ timeout: 30_000 });
  });

  test('switches back, so the picker is not a one-way door', async ({
    page,
  }) => {
    await openSettings(page);
    await pickLanguage(page, 'English');
    await expect(heading(page, 'Appearance')).toBeVisible({ timeout: 30_000 });

    await pickLanguage(page, 'Deutsch');

    await expect(heading(page, 'Darstellung')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });
});
