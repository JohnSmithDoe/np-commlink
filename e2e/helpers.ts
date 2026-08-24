/* ─── why ─────────────────────────────────────────────────────────
 * Every trap here was paid for once, by a spec that passed alone and
 * reddened after an SPA navigation. footguns.md states each in general,
 * so what follows is only what these signatures add.
 *
 * `searchInput` filters on `:visible`, which stops being enough once a
 * domain has two list pages in ONE stack: the departed page still measures
 * non-zero and `.first()` takes it first. That is what `scope` is for.
 *
 * `listRow` matches the row element, not its text — `getByText(/Milk/)`
 * also matches every ancestor containing it.
 *
 * `openRowSwipe` calls the component's own `open()` because Ionic parks an
 * `ion-item-sliding`'s options off-screen, where a gesture never reaches.
 *
 * `addViaSearch` waits twice against the searchbar's 250 ms debounce: once
 * so the Enter handler reads the query just typed, and once after clearing
 * the box so the new row is not still filtered out of view.
 *
 * `persistedDocument` opens the database only once `databases()` says it
 * exists, so probing cannot beat the app's localforage init by creating an
 * empty one first. A slice's write emits no DOM signal, so the store is the
 * only condition a reload can synchronize on — and for a write that
 * REMOVES, absence of the id is the signal.
 *
 * `enableDeckProgram` exists because a cold deck ships EMPTY: any spec
 * touching a tile or a drawer row switches its program on first. It needs
 * the entry id too — the codename is theme-resolved copy the store never
 * sees, and the store is what the reload waits on. Only the grouped lens
 * can switch one on, so `programRow` asks the DOM which accordion holds a
 * codename rather than keeping a table of that.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page } from '@playwright/test';

export const ROUTE = {
  shopping: 'household/shopping',
  storage: 'household/storage',
  tasks: 'tasks/list',
  products: 'household/products',
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

export const CREATE_BUTTON = 'Anlegen';

export function createDialog(page: Page): Locator {
  return presentedDialog(page, 'Neuen Eintrag anlegen');
}

export function editDialog(page: Page): Locator {
  return presentedDialog(page, 'Eintrag bearbeiten');
}

export function nameBox(dialog: Locator): Locator {
  return dialog.getByPlaceholder('Gib einen Namen ein');
}

export function addButton(scope: Locator): Locator {
  return scope.getByTestId('page-header-add');
}

export async function gotoPage(
  page: Page,
  path: string,
  pageSelector: string
): Promise<void> {
  await page.goto(`/#/${path}`);
  await expect(mainContent(page).locator(pageSelector)).toBeVisible({
    timeout: 30_000,
  });
}

export function searchInput(page: Page, scope?: Locator): Locator {
  return (scope ?? page)
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

export async function slideDelete(row: Locator): Promise<void> {
  await openRowSwipe(row, 'end');
  await row.getByTestId('list-row-delete').click();
}

export async function waitForListPage(page: Page): Promise<void> {
  await expect(searchInput(page)).toBeVisible({ timeout: 30_000 });
}

export async function addViaSearch(
  page: Page,
  name: string,
  scope?: Locator
): Promise<void> {
  const input = searchInput(page, scope);
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

export async function waitForPersistedWithout(
  page: Page,
  key: string,
  marker: string
): Promise<void> {
  await expect
    .poll(
      async () => {
        const persisted = await persistedDocument(page, key);
        return persisted !== null && !persisted.includes(marker);
      },
      {
        timeout: 15_000,
        message: `npc-${key} still carried "${marker}"`,
      }
    )
    .toBe(true);
}

export async function pickSelectOption(
  page: Page,
  select: Locator,
  optionLabel: string
): Promise<void> {
  await select.click();
  const alert = page.locator('ion-alert');
  await expect(alert).toBeVisible({ timeout: 15_000 });
  await alert.getByRole('radio', { name: optionLabel }).click();
  await alert.getByRole('button', { name: 'OK' }).click();
  await expect(alert).toBeHidden();
}

const ORDER_LENS = 'Reihenfolge';

export async function openOrderLens(config: Locator): Promise<void> {
  await config
    .getByTestId('deck-config-lens')
    .locator('ion-segment-button')
    .filter({ hasText: ORDER_LENS })
    .click();
}

export async function programRow(
  page: Page,
  codename: string
): Promise<Locator> {
  const config = page.locator('app-page-deck-config');
  const row = config
    .getByTestId('deck-config-row')
    .filter({ hasText: codename });
  const group = config.locator('ion-accordion').filter({
    has: page.getByTestId('deck-config-row').filter({ hasText: codename }),
  });
  if (await group.count()) {
    await group.getByTestId('deck-config-module').click();
  }
  await expect(row).toBeVisible({ timeout: 30_000 });
  return row;
}

export async function enableDeckProgram(
  page: Page,
  codename: string,
  id: string
): Promise<void> {
  await page.goto('/#/commlink/deck');
  const config = page.locator('app-page-deck-config');
  await expect(config.getByTestId('deck-config-lens')).toBeVisible({
    timeout: 30_000,
  });
  const row = await programRow(page, codename);
  await row.getByTestId('deck-config-row-toggle').click();
  await waitForPersisted(page, 'deck', `"${id}"`);
}

export async function gotoFeature(
  page: Page,
  route: (typeof ROUTE)[keyof typeof ROUTE]
): Promise<void> {
  await page.goto(`/#/${route}`);
  await expect(page).toHaveURL(new RegExp(route.replace('/', String.raw`\/`)));
  await waitForListPage(page);
}
