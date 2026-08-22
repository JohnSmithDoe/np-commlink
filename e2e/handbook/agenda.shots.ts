/* ─── why ─────────────────────────────────────────────────────────
 * Handbook shots for SOYKAF, AGENDA and DAILY RUN.
 *
 * SOYKAF is seeded through the UI because the matcher joins three
 * aggregates and a hand-written household document would have to restate
 * all of them; products and pantry rows are two `addViaSearch` calls each.
 * Its rows are a bare `ion-item-sliding`, not the shared row, so there is
 * no `list-row` testid to filter on.
 *
 * AGENDA and DAILY RUN are seeded through the persisted document instead:
 * a due date lives behind an `ion-datetime` sheet and a seven-day dot strip
 * needs days that a click-through cannot reach at all. The write happens
 * after a first boot so the object store exists, and a reload follows so the
 * slice hydrates from disk.
 * ───────────────────────────────────────────────────────────────── */
import { expect, Locator, Page, test } from '@playwright/test';
import { bootDeck, openPage, shot } from './shot';
import {
  addViaSearch,
  createDialog,
  editDialog,
  listRow,
  nameBox,
  openRowSwipe,
  pageRoot,
  waitForPersisted,
} from '../helpers';

const DB_NAME = 'np-commlink';
const STORE_NAME = 'npCommlink';

async function seedDocument(
  page: Page,
  key: string,
  value: unknown
): Promise<void> {
  await page.evaluate(
    async ([databaseName, storeName, documentKey, payload]) => {
      await new Promise<void>((resolve) => {
        const open = indexedDB.open(databaseName as string);
        open.onerror = () => resolve();
        open.onsuccess = () => {
          const database = open.result;
          const transaction = database.transaction(
            storeName as string,
            'readwrite'
          );
          transaction
            .objectStore(storeName as string)
            .put(payload, documentKey);
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => {
            database.close();
            resolve();
          };
        };
      });
    },
    [DB_NAME, STORE_NAME, `npc-${key}`, value] as const
  );
}

const recipesPage = (page: Page) => pageRoot(page, 'app-page-recipes');

const recipeRow = (page: Page, name: string) =>
  recipesPage(page).locator('ion-item-sliding').filter({ hasText: name });

async function createRecipe(page: Page, name: string): Promise<void> {
  await recipesPage(page).getByTestId('page-header-add').click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible();
  await nameBox(dialog).fill(name);
  await dialog.getByRole('button', { name: 'Anlegen' }).click();
  await expect(dialog).toBeHidden();
}

async function openRecipe(page: Page, name: string): Promise<Locator> {
  await recipeRow(page, name).locator('ion-item').first().click();
  const dialog = editDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

async function addIngredient(dialog: Locator, product: string): Promise<void> {
  await dialog.getByTestId('recipe-product-select').click();
  const popover = dialog.page().locator('ion-popover');
  await expect(popover).toBeVisible();
  await popover.getByRole('radio', { name: product, exact: true }).click();
  await expect(popover).toBeHidden();
}

async function setIngredient(
  dialog: Locator,
  product: string,
  amount: string,
  unit: string
): Promise<void> {
  const row = dialog.locator('.recipe-ingredient').filter({ hasText: product });
  await row.locator('app-number-input input').fill(amount);
  await row.locator('ion-select').click();
  const popover = dialog.page().locator('ion-popover');
  await expect(popover).toBeVisible();
  await popover.getByRole('radio', { name: unit, exact: true }).click();
  await expect(popover).toBeHidden();
}

test('soykaf', async ({ page }) => {
  await bootDeck(page);

  const products = await openPage(
    page,
    'household/products',
    'app-page-products'
  );
  for (const name of ['Mehl', 'Milch', 'Eier', 'Zwiebeln', 'Butter']) {
    await addViaSearch(page, name, products);
  }

  const storage = await openPage(page, 'household/storage', 'app-page-storage');
  for (const name of ['Mehl', 'Milch', 'Eier']) {
    await addViaSearch(page, name, storage);
  }

  await openPage(page, 'soykaf', 'app-page-recipes');
  await createRecipe(page, 'Pfannkuchen');
  await createRecipe(page, 'Rührei');
  await createRecipe(page, 'Zwiebelsuppe');

  let dialog = await openRecipe(page, 'Pfannkuchen');
  const numbers = dialog.locator('app-number-input input');
  await numbers.nth(0).fill('4');
  await numbers.nth(1).fill('20');

  await dialog.getByTestId('recipe-product-select').click();
  await expect(page.locator('ion-popover')).toBeVisible();
  await shot(page, 'soykaf-zutat-waehlen');
  await page
    .locator('ion-popover')
    .getByRole('radio', { name: 'Mehl', exact: true })
    .click();
  await expect(page.locator('ion-popover')).toBeHidden();

  await addIngredient(dialog, 'Milch');
  await addIngredient(dialog, 'Eier');
  await setIngredient(dialog, 'Mehl', '300', 'g');
  await setIngredient(dialog, 'Milch', '200', 'ml');
  await dialog
    .locator('ion-textarea textarea')
    .first()
    .fill(
      'Alles verquirlen, zwanzig Minuten ruhen lassen, portionsweise ausbacken.'
    );
  await dialog
    .locator('ion-content')
    .evaluate((element: HTMLElement & { scrollToTop(ms: number): void }) =>
      element.scrollToTop(0)
    );
  await shot(page, 'soykaf-rezept-dialog');
  await dialog.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(dialog).toBeHidden();

  dialog = await openRecipe(page, 'Rührei');
  await addIngredient(dialog, 'Eier');
  await dialog.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(dialog).toBeHidden();

  dialog = await openRecipe(page, 'Zwiebelsuppe');
  await addIngredient(dialog, 'Zwiebeln');
  await addIngredient(dialog, 'Butter');
  await dialog.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(dialog).toBeHidden();

  await expect(recipeRow(page, 'Pfannkuchen')).toContainText('Kochbar');
  await expect(recipeRow(page, 'Zwiebelsuppe')).toContainText('Fehlt');
  await shot(page, 'soykaf-liste');

  await openRowSwipe(recipeRow(page, 'Zwiebelsuppe'), 'end');
  await shot(page, 'soykaf-swipe');
});

const HOUSEHOLD = 'cat-haushalt';
const WORK = 'cat-arbeit';
const HEALTH = 'cat-gesundheit';

const pad = (value: number) => String(value).padStart(2, '0');

const localDay = (offset: number, clock = '09:00:00'): string => {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T${clock}`;
};

const tasksDocument = () => ({
  list: {
    id: '_tasks',
    sort: { sortBy: 'dueAt', sortDirection: 'asc' },
    items: [
      {
        id: 'task-steuer',
        name: 'Steuererklärung abgeben',
        createdAt: localDay(-20),
        categoryIds: [WORK],
        dueAt: localDay(-2),
        prio: 1,
      },
      {
        id: 'task-zahnarzt',
        name: 'Zahnarzttermin vereinbaren',
        createdAt: localDay(-9),
        categoryIds: [HEALTH],
        dueAt: localDay(2),
        prio: 2,
      },
      {
        id: 'task-rezept',
        name: 'Rezept in der Apotheke einlösen',
        createdAt: localDay(-4),
        categoryIds: [HEALTH],
        dueAt: localDay(6),
      },
      {
        id: 'task-fahrrad',
        name: 'Fahrrad zur Werkstatt bringen',
        createdAt: localDay(-3),
        categoryIds: [HOUSEHOLD],
        dueAt: localDay(12),
        prio: 3,
      },
      {
        id: 'task-regal',
        name: 'Regal im Flur aufbauen',
        createdAt: localDay(-6),
        categoryIds: [HOUSEHOLD],
      },
      {
        id: 'task-geschenk',
        name: 'Geschenk für Mama besorgen',
        createdAt: localDay(-1),
      },
    ],
  },
  categoryList: {
    id: '_task-categories',
    items: [
      { id: HOUSEHOLD, name: 'Haushalt', createdAt: localDay(-30) },
      { id: WORK, name: 'Arbeit', createdAt: localDay(-30) },
      { id: HEALTH, name: 'Gesundheit', createdAt: localDay(-30) },
    ],
  },
});

test('agenda', async ({ page }) => {
  await bootDeck(page);
  await seedDocument(page, 'tasks', tasksDocument());

  await page.reload();
  await openPage(page, 'tasks/list', 'app-page-tasks');
  await expect(listRow(page, /Steuererklärung/)).toBeVisible();
  await shot(page, 'agenda-liste');

  await openRowSwipe(listRow(page, /Zahnarzttermin/), 'end');
  await shot(page, 'agenda-swipe');
  await listRow(page, /Zahnarzttermin/).evaluate(
    (element: HTMLElement & { close(): Promise<void> }) => element.close()
  );

  await listRow(page, /Zahnarzttermin/)
    .getByTestId('list-row-select')
    .click();
  const dialog = editDialog(page);
  await expect(dialog).toBeVisible();
  await shot(page, 'agenda-aufgabe-dialog');
  await dialog.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(dialog).toBeHidden();

  await pageRoot(page, 'app-page-tasks')
    .getByRole('button', { name: 'Kategorien verwalten' })
    .click();
  const catalog = pageRoot(page, 'app-page-category-list');
  await expect(catalog).toBeVisible();
  await expect(catalog.getByTestId('list-row').first()).toBeVisible();

  const catalogRow = catalog
    .getByTestId('list-row')
    .filter({ hasText: 'Haushalt' });
  await openRowSwipe(catalogRow, 'start');
  await shot(page, 'agenda-kategorie-swipe');
});

const ritualDocument = () => ({
  completions: [
    { promptId: 'water', completedAt: localDay(-6, '20:15:00') },
    { promptId: 'window', completedAt: localDay(-4, '20:15:00') },
    { promptId: 'stretch', completedAt: localDay(-3, '20:15:00') },
    { promptId: 'one-song', completedAt: localDay(-1, '20:15:00') },
  ],
  dismissed: ['sock-basket', 'walk-backwards'],
  reminder: { enabled: true, hour: 18, minute: 30 },
});

test('dailyrun', async ({ page }) => {
  await bootDeck(page);
  await seedDocument(page, 'ritual', ritualDocument());

  await page.reload();
  const ritual = await openPage(page, 'ritual', 'app-page-ritual');
  await expect(ritual.getByTestId('ritual-card-task')).not.toBeEmpty();
  await shot(page, 'dailyrun-karte');

  await ritual.getByTestId('ritual-complete').click();
  await expect(ritual.getByTestId('ritual-done')).toBeVisible();
  await shot(page, 'dailyrun-erledigt');

  await waitForPersisted(page, 'ritual', 'completions');

  const toast = page.getByTestId('action-toast');
  await toast.getByRole('button', { name: 'X' }).click();
  await expect(toast).toBeHidden();

  await ritual.getByTestId('ritual-settings-link').click();
  const settings = pageRoot(page, 'app-page-ritual-settings');
  await expect(settings).toBeVisible();
  await expect(settings.getByTestId('ritual-reminder-time')).toBeVisible();
  await shot(page, 'dailyrun-einstellungen');
});
