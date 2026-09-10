/* ─── why ─────────────────────────────────────────────────────────
 * The shared date control, proved through the lightest dialog that holds
 * one. `ion-datetime` renders three month panes side by side and SCROLLS
 * the middle one into view; the month it reports and the month you can see
 * are separate facts, so the assertion is that the chosen day is on screen,
 * not that the header names its month — the header was right throughout the
 * bug this guards.
 *
 * Both halves matter and only the second one broke: a picker holding a date
 * has to open on it, and an empty one on today.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  addViaSearch,
  dateBox,
  listRow,
  pickDate,
  waitForListPage,
} from '../helpers';

const DUE = '2026-11-17';

function openPicker(field: Locator): Promise<void> {
  return dateBox(field).click();
}

function calendar(page: Page): Locator {
  return page.locator('ion-modal:not(.overlay-hidden) ion-datetime');
}

async function dueDateField(page: Page, name: string): Promise<Locator> {
  await listRow(page, new RegExp(name)).click();
  const dialog = page.locator('ion-modal.show-modal').first();
  return dialog.locator('app-date-input');
}

test.describe('the due-date picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/tasks/list');
    await waitForListPage(page);
    await addViaSearch(page, 'Steuer');
    await expect(listRow(page, /Steuer/)).toBeVisible({ timeout: 10_000 });
  });

  test('reopens on the date it holds, not the month before it', async ({
    page,
  }) => {
    const field = await dueDateField(page, 'Steuer');
    await pickDate(field, DUE);
    await expect(dateBox(field)).toHaveValue('17.11.2026');

    await openPicker(field);
    const chosen = calendar(page).locator(
      'button.calendar-day[data-day="17"][data-month="11"][data-year="2026"]'
    );
    await expect(chosen).toBeInViewport();
  });

  test('opens an empty picker on today', async ({ page }) => {
    const field = await dueDateField(page, 'Steuer');
    await openPicker(field);

    const now = new Date();
    const today = calendar(page).locator(
      `button.calendar-day[data-day="${now.getDate()}"][data-month="${now.getMonth() + 1}"][data-year="${now.getFullYear()}"]`
    );
    await expect(today).toBeInViewport();
  });

  test('sets the date from a quick pick, without opening the calendar', async ({
    page,
  }) => {
    await dueDateField(page, 'Steuer');
    const dialog = page.locator('ion-modal.show-modal').first();

    await dialog
      .getByTestId('date-shortcut')
      .filter({ hasText: 'Morgen' })
      .click();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await expect(dateBox(dialog.locator('app-date-input'))).toHaveValue(
      tomorrow.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    );
    await expect(calendar(page)).toBeHidden();
  });

  test('clears the date it set, and offers nothing to clear before that', async ({
    page,
  }) => {
    await dueDateField(page, 'Steuer');
    const dialog = page.locator('ion-modal.show-modal').first();
    const clear = dialog.getByTestId('date-shortcut-clear');
    const box = dateBox(dialog.locator('app-date-input'));

    await expect(clear).toHaveAttribute('aria-disabled', 'true');

    await dialog
      .getByTestId('date-shortcut')
      .filter({ hasText: 'Heute' })
      .click();
    await expect(box).not.toHaveValue('');
    await expect(clear).not.toHaveAttribute('aria-disabled', 'true');

    await clear.click();
    await expect(box).toHaveValue('');
  });
});
