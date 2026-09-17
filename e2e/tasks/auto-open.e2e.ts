/* ─── why ─────────────────────────────────────────────────────────
 * The anchor control is the one thing here a unit test cannot show: it is
 * absent by design on a calendar-positioned cadence and present on an
 * elapsed one, and "absent because the branch is right" and "absent
 * because the component failed to render" are the same DOM. Driving both
 * cadences in one run is what tells them apart.
 *
 * Chips are located by ROLE, never by testid. Ionic copies a host's
 * `aria-*` onto the native button in its shadow root and drops it from the
 * host on first render, so a testid locator resolves the host and reads
 * `aria-pressed` as absent until the first click puts it back — which made
 * exactly the initial-state assertions lie.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import { addViaSearch, listRow, waitForListPage } from '../helpers';

const TASK = 'Rauchmelder prüfen';

function dialog(page: Page): Locator {
  return page.locator('ion-modal.show-modal').first();
}

function chipRow(page: Page, label: string): Locator {
  return dialog(page).locator('app-option-chips').filter({ hasText: label });
}

function chip(row: Locator, name: string): Locator {
  return row.getByRole('button', { name });
}

function pressedChip(row: Locator, name: string): Locator {
  return row.getByRole('button', { name, pressed: true });
}

async function pickUnit(page: Page, unit: string): Promise<void> {
  await dialog(page)
    .getByTestId('interval-unit')
    .locator('ion-segment-button')
    .filter({ hasText: unit })
    .first()
    .click();
}

async function openTask(page: Page): Promise<void> {
  await listRow(page, new RegExp(TASK)).click();
  await expect(dialog(page)).toBeVisible();
}

test.describe('a repeating task', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/tasks/list');
    await waitForListPage(page);
    await addViaSearch(page, TASK);
    await expect(listRow(page, new RegExp(TASK))).toBeVisible({
      timeout: 10_000,
    });
    await openTask(page);
  });

  test('names the months it falls in, without a count', async ({ page }) => {
    await pickUnit(page, 'Im Monat');

    const months = dialog(page).getByTestId('month');
    await expect(months).toHaveCount(12);
    await expect(dialog(page).getByTestId('interval-summary')).toHaveText(
      'Noch kein Monat gewählt'
    );

    await months.nth(2).click();
    await months.nth(5).click();
    await expect(dialog(page).getByTestId('interval-summary')).toHaveText(
      'Im März, Juni'
    );
  });

  test('offers an anchor only where the cadence leaves one open', async ({
    page,
  }) => {
    await pickUnit(page, 'Woche');
    await expect(chipRow(page, 'Nächster Termin')).toHaveCount(0);

    await dialog(page)
      .getByTestId('date-shortcut')
      .filter({ hasText: 'Morgen' })
      .click();

    const anchor = chipRow(page, 'Nächster Termin');
    await expect(anchor).toBeVisible();

    await expect(pressedChip(anchor, 'Ab Fälligkeit')).toHaveCount(0);
    await chip(anchor, 'Ab Fälligkeit').click();
    await expect(pressedChip(anchor, 'Ab Fälligkeit')).toHaveCount(1);

    await pickUnit(page, 'Im Monat');
    await expect(chipRow(page, 'Nächster Termin')).toHaveCount(0);
  });

  test('asks for a lead time as soon as there is a cadence', async ({
    page,
  }) => {
    await expect(chipRow(page, 'Wieder öffnen')).toHaveCount(0);
    await pickUnit(page, 'Woche');

    const lead = chipRow(page, 'Wieder öffnen');
    await expect(pressedChip(lead, 'Am Tag selbst')).toHaveCount(1);

    await chip(lead, '3 Tage vorher').click();
    await expect(pressedChip(lead, '3 Tage vorher')).toHaveCount(1);
    await expect(pressedChip(lead, 'Am Tag selbst')).toHaveCount(0);

    await chip(lead, 'Am Tag selbst').click();
    await expect(pressedChip(lead, 'Am Tag selbst')).toHaveCount(1);
  });
});

test.describe('the agenda settings', () => {
  test('are reached from the list, and survive a reload', async ({ page }) => {
    await page.goto('/#/tasks/list');
    await waitForListPage(page);

    await page.getByTestId('task-settings-link').click();
    await expect(page).toHaveURL(/tasks\/settings/);

    const warn = () =>
      page.locator('app-option-chips').filter({ hasText: 'Warnung' });

    await expect(pressedChip(warn(), 'Früher')).toHaveCount(0);
    await chip(warn(), 'Früher').click();
    await expect(pressedChip(warn(), 'Früher')).toHaveCount(1);

    await page.reload();
    await expect(pressedChip(warn(), 'Früher')).toHaveCount(1, {
      timeout: 10_000,
    });
  });
});
