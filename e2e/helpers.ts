/* ─── why ─────────────────────────────────────────────────────────
 * Every trap encoded here was paid for once, by a spec that passed alone
 * and reddened after an SPA navigation. They live in one place so no spec
 * re-derives them; CLAUDE.md carries the general statement of each, so
 * what follows is only what is not there.
 *
 * Playwright gives every test a fresh browser context, so each one boots
 * against an empty IndexedDB and whatever a test seeds is the whole of
 * its state.
 *
 * `presentedDialog` keys off `.show-modal` plus the title because every
 * simpler scope was measured wrong: presenting MOVES the `ion-modal` to
 * `ion-app` and leaves an `overlay-hidden` twin inside the wrapper, one
 * list route mounts five of them, and Ionic sets no `role="dialog"` at
 * all.
 *
 * `searchInput` filters on `:visible` because Ionic marks an inactive
 * routed page `.ion-page-hidden` rather than unmounting it, so after one
 * navigation two searchbars exist and the element name cannot say which
 * is live.
 *
 * `listRow` matches the row element rather than its text:
 * `getByText(/Milk/)` also matches every ancestor whose text contains it,
 * and dropping that ambiguity is what removes the `.first()`.
 *
 * `openRowSwipe` calls the component's own `open()` because Ionic parks
 * an `ion-item-sliding`'s options translated off-screen, where a
 * synthesized swipe gesture never reaches them. It takes the sliding
 * element rather than the row because the two are not always the same —
 * `data-testid="list-row"` sits ON the `ion-item-sliding` in the shared
 * list row, while trackplay's rows wrap theirs.
 *
 * `addViaSearch` waits twice against the searchbar's 250 ms debounce:
 * once so the Enter handler reads the query just typed instead of the
 * previous one, and once after clearing the box so the freshly added row
 * is not still filtered out of view.
 *
 * `persistedDocument` opens the database only once `databases()` says it
 * exists, so probing cannot win the race against the app's own
 * localforage init by creating an empty one first. One store holds every
 * `npc-*` doc — see `storageConfig` in `src/main.ts`.
 *
 * `waitForPersisted` exists because a slice's disk write emits no DOM
 * signal whatsoever, so the store itself is the only honest condition a
 * following reload can be synchronized on.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page } from '@playwright/test';

export const ROUTE = {
  shopping: 'household/shopping/_shopping',
  storage: 'household/storage/_storage',
  tasks: 'tasks/list',
  products: 'household/products/_products',
} as const;

export function mainContent(page: Page): Locator {
  return page.locator('#main-content');
}

export function pageRoot(page: Page, selector: string): Locator {
  return mainContent(page).locator(selector);
}

export function presentedDialog(page: Page, title: string): Locator {
  return page.locator('ion-modal.show-modal').filter({ hasText: title });
}

export function searchInput(page: Page): Locator {
  return page
    .locator('app-item-list-searchbar ion-searchbar input:visible')
    .first();
}

export function listRow(page: Page, text: string | RegExp): Locator {
  return page.getByTestId('list-row').filter({ hasText: text });
}

export async function openRowSwipe(
  sliding: Locator,
  side: 'start' | 'end'
): Promise<void> {
  await sliding.evaluate(
    (element: HTMLElement & { open(side: string): Promise<void> }, which) =>
      element.open(which),
    side
  );
}

export async function waitForListPage(page: Page): Promise<void> {
  await expect(searchInput(page)).toBeVisible({ timeout: 30_000 });
}

export async function addViaSearch(page: Page, name: string): Promise<void> {
  const input = searchInput(page);
  await input.click();
  await input.fill(name);
  await page.waitForTimeout(400); // > searchbar debounce (250ms)
  await input.press('Enter');
  await input.fill('');
  await page.waitForTimeout(400);
}

const DB_NAME = 'np-commlink';
const STORE_NAME = 'npCommlink';

async function persistedDocument(
  page: Page,
  key: string
): Promise<string | null> {
  return page.evaluate(
    async ([databaseName, storeName, documentKey]) => {
      const existing = await indexedDB.databases();
      if (!existing.some((candidate) => candidate.name === databaseName))
        return null;

      return new Promise<string | null>((resolve) => {
        const open = indexedDB.open(databaseName);
        open.onerror = () => resolve(null);
        open.onsuccess = () => {
          const database = open.result;
          if (!database.objectStoreNames.contains(storeName)) {
            database.close();
            resolve(null);
            return;
          }
          const read = database
            .transaction(storeName, 'readonly')
            .objectStore(storeName)
            .get(documentKey);
          read.onerror = () => {
            database.close();
            resolve(null);
          };
          read.onsuccess = () => {
            database.close();
            resolve(
              read.result === undefined ? null : JSON.stringify(read.result)
            );
          };
        };
      });
    },
    [DB_NAME, STORE_NAME, `npc-${key}`] as const
  );
}

export async function waitForPersisted(
  page: Page,
  key: string,
  marker?: string
): Promise<void> {
  await expect
    .poll(
      async () => {
        const persisted = await persistedDocument(page, key);
        return (
          persisted !== null &&
          (marker === undefined || persisted.includes(marker))
        );
      },
      {
        timeout: 15_000,
        message: `npc-${key} was never persisted${marker ? ` containing "${marker}"` : ''}`,
      }
    )
    .toBe(true);
}

export async function gotoFeature(
  page: Page,
  route: (typeof ROUTE)[keyof typeof ROUTE]
): Promise<void> {
  await page.goto(`/#/${route}`);
  await expect(page).toHaveURL(new RegExp(route.replace('/', String.raw`\/`)));
  await waitForListPage(page);
}
