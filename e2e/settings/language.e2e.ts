import { expect, Page, test } from '@playwright/test';

/**
 * Acceptance test for the language switch — the one thing about it that unit
 * tests structurally cannot show.
 *
 * Switching restarts the app (pure pipes cache their formatted output, and
 * `LOCALE_ID` is a provider), so the choice has to survive a reload it triggers
 * itself: the doc write must win the race against the reload, and the mirror
 * `LOCALE_ID` reads at boot must already hold the new value. In jsdom none of
 * that is observable — there is no reload and no real IndexedDB.
 */

const settingsPage = (page: Page) => page.locator('app-page-settings');

const heading = (page: Page, text: string) =>
  settingsPage(page).getByText(text, { exact: true });

async function openSettings(page: Page): Promise<void> {
  await page.goto('/#/settings');
  await page.reload();
  // German is the default, so the German heading is the "booted" signal.
  await expect(heading(page, 'Darstellung')).toBeVisible({ timeout: 30_000 });
}

async function pickLanguage(page: Page, label: string): Promise<void> {
  await settingsPage(page)
    .locator('ion-segment-button')
    .filter({ hasText: label })
    .click();
}

test.describe('language switch', () => {
  test('switches to English and survives the restart it triggers', async ({
    page,
  }) => {
    await openSettings(page);

    await pickLanguage(page, 'English');

    // No explicit reload here: the app restarts itself, and the English heading
    // is only reachable through that restart plus a persisted read.
    await expect(heading(page, 'Appearance')).toBeVisible({ timeout: 30_000 });
    await expect(heading(page, 'Language')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // A cold read: the choice came off disk, not out of the live store.
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
