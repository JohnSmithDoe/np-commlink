import { expect, Locator, Page } from '@playwright/test';

/**
 * Shared helpers for the np-commlink e2e suite.
 *
 * The app is a zoneless Ionic/NgRx app that hydrates its slices from Ionic
 * Storage (IndexedDB) on boot. Playwright gives every test a fresh browser
 * context, so each test starts from empty lists.
 *
 * Unlike the original kitchen-bot, the grocery features are independent
 * top-level routes reached by **hash URLs** (`withHashLocation()`); there is no
 * ion-tabs bottom shell — navigation is via the side menu or a direct URL.
 */

export const ROUTE = {
  shopping: 'shopping/_shopping',
  storage: 'storage/_storage',
  tasks: 'tasks/_tasks',
  products: 'products/_products',
} as const;

/**
 * The native input inside the Ionic searchbar of the *currently visible* list
 * page. Ionic keeps inactive routed pages in the DOM (marked
 * `.ion-page-hidden`), so after a navigation more than one searchbar may exist —
 * scope to the visible one to avoid strict-mode violations.
 */
export function searchInput(page: Page): Locator {
  return page
    .locator('app-item-list-searchbar ion-searchbar input:visible')
    .first();
}

/** Wait until the active grocery list page has booted (searchbar rendered). */
export async function waitForListPage(page: Page): Promise<void> {
  await expect(searchInput(page)).toBeVisible({ timeout: 30_000 });
}

/**
 * Add an item to the currently visible list by typing into the searchbar and
 * pressing Enter. A short wait lets the searchbar's 250ms debounce push the
 * query into the store before the Enter handler reads it.
 */
export async function addViaSearch(page: Page, name: string): Promise<void> {
  const input = searchInput(page);
  await input.click();
  await input.fill(name);
  await page.waitForTimeout(400); // > searchbar debounce (250ms)
  await input.press('Enter');
  // clear the search so the freshly added item is not filtered out of view
  await input.fill('');
  await page.waitForTimeout(400);
}

/** Navigate to a grocery feature via its hash URL and wait for it to boot. */
export async function gotoFeature(
  page: Page,
  route: (typeof ROUTE)[keyof typeof ROUTE]
): Promise<void> {
  await page.goto(`/#/${route}`);
  await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/')));
  await waitForListPage(page);
}
