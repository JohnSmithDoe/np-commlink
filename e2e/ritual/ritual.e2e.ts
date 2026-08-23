/* ─── why ─────────────────────────────────────────────────────────
 * The prompt is drawn at random, so no spec may name one. What is stable
 * is that the card carries SOME text, that a reroll replaces it with a
 * different one, and that finishing swaps the card for the done state —
 * which is what these assert instead.
 *
 * The reload test waits on the disk write rather than on the DOM: the
 * completion has no visual settling point after the confetti, and a
 * reload that beat the write would read as a lost day.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import { mainContent, pageRoot, waitForPersisted } from '../helpers';

const RITUAL_PAGE = 'app-page-ritual';

async function gotoRitual(page: Page): Promise<void> {
  await page.goto('/#/ritual');
  await expect(mainContent(page).locator(RITUAL_PAGE)).toBeVisible({
    timeout: 30_000,
  });
}

const card = (page: Page) =>
  pageRoot(page, RITUAL_PAGE).getByTestId('ritual-card');
const cardTask = (page: Page) =>
  pageRoot(page, RITUAL_PAGE).getByTestId('ritual-card-task');
const done = (page: Page) =>
  pageRoot(page, RITUAL_PAGE).getByTestId('ritual-done');
const count = (page: Page) =>
  pageRoot(page, RITUAL_PAGE).getByTestId('ritual-count').locator('strong');

async function completeTask(page: Page): Promise<void> {
  await pageRoot(page, RITUAL_PAGE).getByTestId('ritual-complete').click();
  await expect(done(page)).toBeVisible({ timeout: 15_000 });
}

test.describe('task of the day', () => {
  test('offers one card, and it says something', async ({ page }) => {
    await gotoRitual(page);

    await expect(card(page)).toBeVisible();
    await expect(cardTask(page)).not.toBeEmpty();
    await expect(done(page)).toBeHidden();
  });

  test('keeps the reminder out of the way, one tap from the header', async ({
    page,
  }) => {
    await gotoRitual(page);
    await expect(
      pageRoot(page, RITUAL_PAGE).getByTestId('ritual-reminder-toggle')
    ).toHaveCount(0);

    await pageRoot(page, RITUAL_PAGE)
      .getByTestId('ritual-settings-link')
      .click();

    const settings = pageRoot(page, 'app-page-ritual-settings');
    await expect(settings).toBeVisible({ timeout: 30_000 });
    await expect(settings.getByTestId('ritual-reminder-toggle')).toBeVisible();
  });

  test('rerolls to a different task without closing the day', async ({
    page,
  }) => {
    await gotoRitual(page);
    await expect(cardTask(page)).not.toBeEmpty();
    const shown = await cardTask(page).textContent();
    const first = shown?.trim() ?? '';

    await pageRoot(page, RITUAL_PAGE).getByTestId('ritual-reroll').click();

    await expect(cardTask(page)).not.toHaveText(first);
    await expect(card(page)).toBeVisible();
    await expect(done(page)).toBeHidden();
  });

  test('a dismissed task is gone for good, and the way back is offered', async ({
    page,
  }) => {
    await gotoRitual(page);
    await expect(cardTask(page)).not.toBeEmpty();
    const shown = await cardTask(page).textContent();
    const dismissed = shown?.trim() ?? '';

    await pageRoot(page, RITUAL_PAGE).getByTestId('ritual-dismiss').click();
    await expect(cardTask(page)).not.toHaveText(dismissed);

    await waitForPersisted(page, 'ritual', 'dismissed');
    await page.reload();
    await expect(mainContent(page).locator(RITUAL_PAGE)).toBeVisible({
      timeout: 30_000,
    });

    await pageRoot(page, RITUAL_PAGE)
      .getByTestId('ritual-settings-link')
      .click();
    const settings = pageRoot(page, 'app-page-ritual-settings');
    await expect(
      settings.getByTestId('ritual-restore-dismissed')
    ).toBeEnabled();
  });

  test('closes the day, counts it, and keeps it across a reload', async ({
    page,
  }) => {
    await gotoRitual(page);
    const shown = await cardTask(page).textContent();
    const chosen = shown?.trim();

    await completeTask(page);

    await expect(
      pageRoot(page, RITUAL_PAGE).getByTestId('ritual-done-task')
    ).toHaveText(chosen!);
    await expect(count(page)).toHaveText('1');

    await waitForPersisted(page, 'ritual', 'completions');
    await page.reload();
    await expect(mainContent(page).locator(RITUAL_PAGE)).toBeVisible({
      timeout: 30_000,
    });

    await expect(done(page)).toBeVisible();
    await expect(card(page)).toBeHidden();
  });

  test('a bonus raises the count but leaves the day closed', async ({
    page,
  }) => {
    await gotoRitual(page);
    await completeTask(page);

    await pageRoot(page, RITUAL_PAGE).getByTestId('ritual-bonus').click();
    await expect(card(page)).toBeVisible();

    await completeTask(page);
    await expect(count(page)).toHaveText('2');
  });
});
