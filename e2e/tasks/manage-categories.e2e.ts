/* ─── why ─────────────────────────────────────────────────────────
 * The category catalog on the shared list page, plus the drill from a
 * category into its filtered list. The drill is real-browser only: it
 * navigates with `?filter=<id>`, and an effect applies that on
 * `ROUTER_NAVIGATED` — which lands after the resolver re-hydrates only
 * because a real router runs resolvers at all. That ordering is the whole
 * correctness argument (see footguns.md), and jsdom cannot run it.
 *
 * `addCategory` is a local copy of `addViaSearch` and has to stay one.
 * The shared helper takes the FIRST visible searchbar, and the task list
 * this page was opened from is still mounted, so typing through it would
 * silently add a TASK and the spec would pass having proved nothing.
 * `catalogRow` is scoped for the same reason: a task of the same name
 * would match too.
 *
 * The catalog projects its own back link into the toolbar, because the
 * shared header's start slot is already the menu button — and a
 * `routerLink` renders an anchor, hence `getByRole('link')`.
 *
 * A catalog row spends its two gestures differently from an item row: a
 * tap DRILLS instead of opening the dialog, and the rename is the
 * start-swipe, which opens the same shared item dialog every list uses.
 * `data-testid="list-row"` sits ON the `ion-item-sliding`, so the row
 * locator is already the element `openRowSwipe` wants.
 *
 * A row's note is its item count, so the `0` is what asserts the join is
 * live.
 *
 * Clearing has to assert the URL too, not just the caption: the state and
 * the `?filter=` param are two separate arms of the same filter, and a
 * reload re-applies whichever one is left standing.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import {
  openRowSwipe,
  pageRoot,
  waitForListPage,
  waitForPersisted,
} from '../helpers';

const catalogPage = (page: Page) => pageRoot(page, 'app-page-category-list');

async function openCatalog(page: Page) {
  await page
    .getByRole('button', { name: 'Kategorien verwalten' })
    .first()
    .click();
  await expect(page).toHaveURL(/tasks\/categories/);
  await expect(catalogPage(page)).toBeVisible({ timeout: 10_000 });
}

async function addCategory(page: Page, name: string) {
  const input = catalogPage(page).locator('ion-searchbar input');
  await input.click();
  await input.fill(name);
  await page.waitForTimeout(400); // > the searchbar's 250ms debounce
  await input.press('Enter');
  await input.fill('');
  await page.waitForTimeout(400);
  await expect(catalogRow(page, name)).toBeVisible({ timeout: 10_000 });
}

const catalogRow = (page: Page, name: string) =>
  catalogPage(page).getByTestId('list-row').filter({ hasText: name });

test.describe('manage categories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/tasks/list');
    await waitForListPage(page);
  });

  test('adds a category from the catalog page', async ({ page }) => {
    await openCatalog(page);
    await addCategory(page, 'Arbeit');

    await expect(catalogRow(page, 'Arbeit')).toContainText('0');

    await page.goBack();
    await expect(page).toHaveURL(/tasks\/list$/);
  });

  test('renames a category through the shared edit dialog', async ({
    page,
  }) => {
    await openCatalog(page);
    await addCategory(page, 'Arbeit');
    await waitForPersisted(page, 'tasks', 'Arbeit');

    const row = catalogRow(page, 'Arbeit');
    await openRowSwipe(row, 'start');
    await row.locator('ion-item-option').first().click();

    const nameInput = page
      .locator('ion-modal.show-modal')
      .getByPlaceholder('Gib einen Namen ein');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill('Büro');
    await page.getByRole('button', { name: 'Übernehmen' }).click();

    await expect(catalogRow(page, 'Büro')).toBeVisible({ timeout: 10_000 });
  });

  test('drills from a category into the filtered list', async ({ page }) => {
    await openCatalog(page);
    await addCategory(page, 'Arbeit');
    await waitForPersisted(page, 'tasks', 'Arbeit');

    await catalogRow(page, 'Arbeit').click();

    await expect(page).toHaveURL(/tasks\/list\?filter=/);
    await expect(
      page.getByRole('button', { name: 'Arbeit', pressed: true })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('clears the filter and the query param it came from', async ({
    page,
  }) => {
    await openCatalog(page);
    await addCategory(page, 'Arbeit');
    await waitForPersisted(page, 'tasks', 'Arbeit');

    await catalogRow(page, 'Arbeit').click();
    const armed = page.getByRole('button', { name: 'Arbeit', pressed: true });
    await expect(armed).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('clear-category-filter').click();

    await expect(armed).toHaveCount(0);
    await expect(page).toHaveURL(/tasks\/list$/);
  });
});
