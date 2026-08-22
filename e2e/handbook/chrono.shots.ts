/* ─── why ─────────────────────────────────────────────────────────
 * Handbook shots for CHRONO and MEATSPACE. Both live in one file because
 * they are one chapter of the deck: a task's timer and the office-day grid.
 *
 * A running timer is the shot that matters for CHRONO, so the sequence is
 * strict: three tasks, three starts (each start stops the one before), the
 * viewport shot, and only THEN "Speichern" — which archives the sessions and
 * empties the live rows, so the stats page has data to group.
 *
 * `ion-datetime` paints its calendar into a shadow root and its
 * out-of-month cells are disabled, so the day cells are reached by class
 * plus exact text rather than by index.
 * ───────────────────────────────────────────────────────────────── */
import { expect, Locator, Page, test } from '@playwright/test';
import { addViaSearch, mainContent, pickSelectOption } from '../helpers';
import { openPage, shot } from './shot';

const TASKS = ['LF-4821 Rechnungslauf', 'Standup', 'Code Review'];

const trackingRow = (page: Page, name: string): Locator =>
  mainContent(page).locator('app-tracking-item').filter({ hasText: name });

async function startTracking(page: Page, name: string): Promise<void> {
  await trackingRow(page, name).locator('.tracking-item-title').click();
  await page.waitForTimeout(2500);
}

test('chrono', async ({ page }) => {
  await openPage(page, 'tracking', 'app-page-tracking');

  for (const task of TASKS) await addViaSearch(page, task);
  for (const task of TASKS) await expect(trackingRow(page, task)).toBeVisible();

  await startTracking(page, 'Standup');
  await startTracking(page, 'LF-4821 Rechnungslauf');
  await startTracking(page, 'Code Review');

  await shot(page, 'chrono-list');

  await trackingRow(page, 'Code Review')
    .getByTestId('tracking-item-kebab')
    .click();
  const popover = page.locator('ion-popover:not(.overlay-hidden)');
  await expect(popover.getByText('Bearbeiten')).toBeVisible();
  await shot(page, 'chrono-kebab');
  await page.keyboard.press('Escape');
  await expect(popover).toHaveCount(0);

  const daily = mainContent(page).locator('app-daily-sessions');
  await daily.scrollIntoViewIfNeeded();
  await shot(page, 'chrono-today');

  await mainContent(page).getByText('Testdaten erzeugen').click();
  await page.waitForTimeout(500);
  await mainContent(page).getByText('Speichern').click();
  await page.waitForTimeout(4000);

  await openPage(page, 'data', 'app-page-stats');
  await expect(mainContent(page).locator('app-stats-item').first()).toBeVisible(
    {
      timeout: 30_000,
    }
  );
  await shot(page, 'chrono-data');

  await pickSelectOption(
    page,
    page.locator('ion-select:visible').first(),
    'Einzeln'
  );
  const sliding = mainContent(page)
    .locator('app-stats-item ion-item-sliding')
    .first();
  await expect(sliding).toBeVisible();
  await sliding.evaluate(
    (element: HTMLElement & { open(side: string): Promise<void> }) =>
      element.open('end')
  );
  await shot(page, 'chrono-swipe');
});

async function tapCalendarDay(
  calendar: Locator,
  month: number,
  day: number
): Promise<void> {
  const cell = calendar.locator(
    `button.calendar-day[data-month="${month}"][data-day="${day}"]`
  );
  await cell.click();
  await cell.page().waitForTimeout(400);
}

async function revealDeferredCards(dashboard: Locator): Promise<void> {
  const content = dashboard.locator('ion-content');
  for (let step = 0; step < 30; step++) {
    await content.evaluate(
      (
        element: HTMLElement & {
          scrollByPoint(x: number, y: number, d: number): Promise<void>;
        }
      ) => element.scrollByPoint(0, 300, 0)
    );
    await dashboard.page().waitForTimeout(250);
  }
  await content.evaluate(
    (element: HTMLElement & { scrollToTop(d: number): Promise<void> }) =>
      element.scrollToTop(0)
  );
  await dashboard.page().waitForTimeout(300);
}

test('meatspace', async ({ page }) => {
  await openPage(page, 'office-time', 'app-page-office-time');
  const dashboard = mainContent(page).locator('app-page-office-time');

  const button = dashboard.locator('app-dash-button');
  await expect(button.getByText('Bürotag erfassen')).toBeVisible({
    timeout: 30_000,
  });
  await shot(page, 'meatspace-dashboard');

  await button.locator('ion-button').click();
  await expect(button.getByText('Bürotag erfasst.')).toBeVisible();
  await shot(page, 'meatspace-logged');

  await revealDeferredCards(dashboard);

  const calendar = dashboard.locator('app-dash-office-days-edit ion-datetime');
  await calendar.scrollIntoViewIfNeeded();
  await expect(calendar).toBeVisible({ timeout: 30_000 });
  const month = await page.evaluate(() => new Date().getMonth() + 1);
  for (const day of [4, 5, 11, 12, 18, 19]) {
    await tapCalendarDay(calendar, month, day);
  }
  await calendar.scrollIntoViewIfNeeded();
  await shot(page, 'meatspace-calendar');

  const monthCard = dashboard
    .locator('app-dash-stats')
    .filter({ hasText: 'Monatsübersicht' });
  await monthCard.scrollIntoViewIfNeeded();
  await expect(monthCard).toBeVisible({ timeout: 30_000 });
  await shot(page, 'meatspace-stats');

  const holidays = dashboard.locator('app-dash-holidays');
  await holidays.scrollIntoViewIfNeeded();
  await expect(holidays.getByText('Feiertage in Berlin')).toBeVisible({
    timeout: 30_000,
  });
  await shot(page, 'meatspace-holidays');

  await dashboard.getByTestId('office-time-settings-link').click();
  const settings = mainContent(page).locator('app-page-office-time-settings');
  await expect(settings).toBeVisible({ timeout: 30_000 });
  await settings.getByTestId('office-reminder-toggle').click();
  await expect(settings.getByTestId('office-reminder-time')).toBeVisible();
  await shot(page, 'meatspace-settings');
});
