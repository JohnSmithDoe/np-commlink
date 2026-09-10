/* ─── why ─────────────────────────────────────────────────────────
 * The whole chain in one pass, because every link is invisible alone:
 * the interval has to persist, survive a close, be read back as a date
 * nobody typed, and paint a status bar on a row in the DONE section —
 * the one section the colour rule used to skip outright.
 *
 * `list-row-status` renders only when there IS a colour, so its presence
 * on the recurring row and its absence on the finished one is the whole
 * assertion. The date is computed here rather than fixed: closing stamps
 * `doneAt` from the run's own clock.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  addViaSearch,
  listRow,
  openRowSwipe,
  waitForListPage,
} from '../helpers';

const TASK = 'Heizungswartung';
const ONCE = 'Briefmarken';

function numberOption(scope: Locator, value: number): Locator {
  return scope.getByTestId('number-select-option').nth(value - 1);
}

async function chooseInterval(
  page: Page,
  unit: string,
  count: number
): Promise<void> {
  const dialog = page.locator('ion-modal.show-modal').first();
  await dialog
    .getByTestId('interval-unit')
    .locator('ion-segment-button')
    .filter({ hasText: unit })
    .first()
    .click();

  await numberOption(dialog.locator('app-interval-input'), count).click();
}

async function setInterval_(page: Page): Promise<void> {
  await listRow(page, new RegExp(TASK)).click();
  await chooseInterval(page, 'Monat', 3);
  await page.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(page.locator('ion-modal.show-modal')).toBeHidden();
}

async function close(page: Page, name: string): Promise<void> {
  const row = listRow(page, new RegExp(name));
  await openRowSwipe(row, 'start');
  await row.locator('ion-item-option').first().click();
  await expect(row.getByTestId('list-row-label')).toHaveClass(/bought/, {
    timeout: 10_000,
  });
}

function statusBar(page: Page, name: string): Locator {
  return listRow(page, new RegExp(name)).getByTestId('list-row-status');
}

function inThreeMonths(): string {
  const due = new Date();
  due.setMonth(due.getMonth() + 3);
  return due.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

test.describe('a recurring task', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/tasks/list');
    await waitForListPage(page);
    await addViaSearch(page, TASK);
    await expect(listRow(page, new RegExp(TASK))).toBeVisible({
      timeout: 10_000,
    });
  });

  test('keeps the interval it was given', async ({ page }) => {
    await setInterval_(page);

    await listRow(page, new RegExp(TASK)).click();
    await expect(
      page
        .locator('ion-modal.show-modal')
        .first()
        .getByTestId('interval-summary')
    ).toHaveText('Alle 3 Monate');
  });

  test('says when it comes round again, and colours the closed row', async ({
    page,
  }) => {
    await addViaSearch(page, ONCE);
    await expect(listRow(page, new RegExp(ONCE))).toBeVisible({
      timeout: 10_000,
    });
    await setInterval_(page);

    await close(page, TASK);
    await close(page, ONCE);

    await expect(listRow(page, new RegExp(TASK))).toContainText(
      `Wieder fällig: ${inThreeMonths()}`
    );
    await expect(statusBar(page, TASK)).toBeVisible();

    await expect(listRow(page, new RegExp(ONCE))).not.toContainText(
      'Wieder fällig'
    );
    await expect(statusBar(page, ONCE)).toHaveCount(0);
  });
});

test.describe('a task priority', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/tasks/list');
    await waitForListPage(page);
    await addViaSearch(page, TASK);
    await expect(listRow(page, new RegExp(TASK))).toBeVisible({
      timeout: 10_000,
    });
    await listRow(page, new RegExp(TASK)).click();
  });

  test('is tapped, and cleared without a keyboard', async ({ page }) => {
    const prio = page
      .locator('ion-modal.show-modal')
      .first()
      .locator('app-number-select')
      .filter({ hasText: 'Priorität' });
    const clear = prio.getByTestId('number-select-clear');

    await expect(clear).toHaveAttribute('aria-disabled', 'true');

    const four = numberOption(prio, 4);
    await four.click();
    await expect(four).toHaveAttribute('aria-pressed', 'true');
    await expect(clear).not.toHaveAttribute('aria-disabled', 'true');

    await clear.click();
    await expect(four).toHaveAttribute('aria-pressed', 'false');
  });
});
