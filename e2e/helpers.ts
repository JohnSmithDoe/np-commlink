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
  shopping: 'groceries/shopping/_shopping',
  storage: 'groceries/storage/_storage',
  tasks: 'tasks/_tasks',
  products: 'groceries/products/_products',
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

// Ionic Storage (localforage) puts every `npc-*` doc of the app into this one
// IndexedDB store — see `storageConfig` in src/main.ts.
const DB_NAME = 'np-commlink';
const STORE_NAME = 'npCommlink';

/**
 * The persisted `npc-<key>` doc, serialized, or `null` while it is absent.
 * Opens the database only once it exists, so probing can never race the app's
 * own localforage init by creating an empty one first.
 */
async function persistedDoc(page: Page, key: string): Promise<string | null> {
  return page.evaluate(
    async ([dbName, storeName, docKey]) => {
      const existing = await indexedDB.databases();
      if (!existing.some((db) => db.name === dbName)) return null;

      return new Promise<string | null>((resolve) => {
        const open = indexedDB.open(dbName);
        open.onerror = () => resolve(null);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.close();
            resolve(null);
            return;
          }
          const read = db
            .transaction(storeName, 'readonly')
            .objectStore(storeName)
            .get(docKey);
          read.onerror = () => {
            db.close();
            resolve(null);
          };
          read.onsuccess = () => {
            db.close();
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

/**
 * Wait until a slice's fire-and-forget disk write has landed — optionally until
 * the doc mentions `marker`. The write emits no DOM signal, so the store itself
 * is the only honest condition to synchronize a following reload on.
 */
export async function waitForPersisted(
  page: Page,
  key: string,
  marker?: string
): Promise<void> {
  await expect
    .poll(
      async () => {
        const doc = await persistedDoc(page, key);
        return doc !== null && (marker === undefined || doc.includes(marker));
      },
      {
        timeout: 15_000,
        message: `npc-${key} was never persisted${marker ? ` containing "${marker}"` : ''}`,
      }
    )
    .toBe(true);
}

/** Navigate to a grocery feature via its hash URL and wait for it to boot. */
export async function gotoFeature(
  page: Page,
  route: (typeof ROUTE)[keyof typeof ROUTE]
): Promise<void> {
  await page.goto(`/#/${route}`);
  await expect(page).toHaveURL(new RegExp(route.replace('/', String.raw`\/`)));
  await waitForListPage(page);
}
