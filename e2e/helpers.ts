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
  tasks: 'tasks/list',
  products: 'groceries/products/_products',
} as const;

/**
 * The routed-page container. The side menu is a sibling list of the SAME
 * destinations, so any content assertion that is not scoped to this can match the
 * menu's copy instead of the page's.
 */
export function mainContent(page: Page): Locator {
  return page.locator('#main-content');
}

/**
 * A single routed page component, scoped inside `#main-content`. Ionic's
 * router-outlet keeps previously-visited sibling pages mounted (and, for
 * URL/hash navigations, still visible) alongside the active one, so page-level
 * locators MUST be scoped to their own page component to stay unambiguous.
 */
export function pageRoot(page: Page, selector: string): Locator {
  return mainContent(page).locator(selector);
}

/**
 * A **presented** `ion-modal`, identified by its title.
 *
 * Three DOM facts make every tempting scope wrong, and each was verified rather
 * than assumed: presenting **moves** the `ion-modal` to `ion-app` and leaves an
 * `overlay-hidden` twin inside the wrapper (so the wrapper element matches two),
 * a single list route mounts **five** `ion-modal`s (the item dialog, its category
 * picker, the date picker, …), and Ionic puts **no `role="dialog"`** on
 * `ion-modal`, so `getByRole('dialog')` matches nothing. `.show-modal` narrows to
 * what is presented; the title narrows to which one.
 *
 * Shared because that reasoning was encoded independently in two specs — and a
 * spec that rediscovers it is a spec that passes alone and reddens after an SPA
 * navigation.
 */
export function presentedDialog(page: Page, title: string): Locator {
  return page.locator('ion-modal.show-modal').filter({ hasText: title });
}

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

/**
 * The list row whose title matches. Matching the row element rather than the
 * text avoids `.first()`: `getByText(/Milk/)` matches the heading *and* every
 * ancestor whose text contains it, while exactly one `list-row` does.
 */
export function listRow(page: Page, text: string | RegExp): Locator {
  return page.getByTestId('list-row').filter({ hasText: text });
}

/**
 * Reveal an `ion-item-sliding`'s options.
 *
 * Ionic keeps them translated off-screen, so a synthesized swipe gesture does not
 * reach them — the component's own `open()` is the only reliable way in. Shared
 * because two specs had derived that independently, and a spec that re-derives it
 * is a spec that will rediscover the trap.
 *
 * Takes the sliding element rather than the row, because the two are not always
 * the same: `data-testid="list-row"` sits ON the `ion-item-sliding` in the shared
 * list row, while trackplay's rows wrap theirs.
 */
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

/** Navigate to a grocery feature via its hash URL and wait for it to boot. */
export async function gotoFeature(
  page: Page,
  route: (typeof ROUTE)[keyof typeof ROUTE]
): Promise<void> {
  await page.goto(`/#/${route}`);
  await expect(page).toHaveURL(new RegExp(route.replace('/', String.raw`\/`)));
  await waitForListPage(page);
}
