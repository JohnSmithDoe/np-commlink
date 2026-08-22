/* ─── why ─────────────────────────────────────────────────────────
 * The editor has no save button, so "did it save" is not something a
 * unit test of the facade can answer for the real page — the debounce,
 * the destroy hook and the slice's save trigger have to agree, and only
 * a reload proves they did.
 *
 * The image tests seed through the file input rather than the camera:
 * `setInputFiles` is the only path a headless run has to a picked file,
 * and it is the same `change` event the button-driven picker raises. It
 * is handed a PATH and not an inline buffer, because no project here
 * pulls in @types/node — so `Buffer` cannot be named. tsconfig.e2e.json
 * carries why that stays true.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Page, test } from '@playwright/test';
import {
  addButton,
  listRow,
  mainContent,
  openRowSwipe,
  waitForPersisted,
} from '../helpers';

const NOTES_PAGE = 'app-page-notes';
const EDITOR_PAGE = 'app-page-note-editor';

const IMAGE_FIXTURE = 'e2e/notes/note-image.png';

const openNotes = async (page: Page): Promise<void> => {
  await page.goto('/#/notes');
  await expect(mainContent(page).locator(NOTES_PAGE)).toBeVisible({
    timeout: 30_000,
  });
};

const startNote = async (page: Page): Promise<void> => {
  await addButton(mainContent(page).locator(NOTES_PAGE)).click();
  await expect(mainContent(page).locator(EDITOR_PAGE)).toBeVisible({
    timeout: 30_000,
  });
};

const titleBox = (page: Page) =>
  mainContent(page).locator(`${EDITOR_PAGE} [data-testid="note-title"] input`);

const bodyBox = (page: Page) =>
  mainContent(page).locator(
    `${EDITOR_PAGE} [data-testid="note-body"] textarea`
  );

const attach = async (page: Page): Promise<void> => {
  await page
    .locator(`${EDITOR_PAGE} input[type="file"]`)
    .setInputFiles(IMAGE_FIXTURE);
};

test.describe('notes', () => {
  test.beforeEach(async ({ page }) => {
    await openNotes(page);
  });

  test('writes a note and finds it again after a reload', async ({ page }) => {
    await startNote(page);
    await titleBox(page).fill('Einkauf');
    await bodyBox(page).fill('Milch und Brot');
    await waitForPersisted(page, 'notes', 'Milch und Brot');

    await page.reload();
    await expect(mainContent(page).locator(EDITOR_PAGE)).toBeVisible({
      timeout: 30_000,
    });
    await expect(titleBox(page)).toHaveValue('Einkauf');
  });

  test('lists the note by its title once the editor is left', async ({
    page,
  }) => {
    await startNote(page);
    await titleBox(page).fill('Urlaub');
    await waitForPersisted(page, 'notes', 'Urlaub');

    await page.goBack();
    await expect(listRow(page, /Urlaub/)).toBeVisible({ timeout: 10_000 });
  });

  test('finds a note by words that live only in its body', async ({ page }) => {
    await startNote(page);
    await titleBox(page).fill('Urlaub');
    await bodyBox(page).fill('Fähre buchen');
    await waitForPersisted(page, 'notes', 'Fähre buchen');
    await page.goBack();

    const search = mainContent(page).locator(
      `${NOTES_PAGE} app-item-list-searchbar ion-searchbar input:visible`
    );
    await search.fill('fähre');
    await page.waitForTimeout(400); // > searchbar debounce (250ms)

    await expect(listRow(page, /Urlaub/)).toBeVisible({ timeout: 10_000 });
  });

  test('leaves no row behind for a note that was never written', async ({
    page,
  }) => {
    await startNote(page);
    await page.goBack();

    await expect(mainContent(page).locator(NOTES_PAGE)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('list-row')).toHaveCount(0);
  });

  test('opens an attached image full screen and rotates it', async ({
    page,
  }) => {
    await startNote(page);
    await titleBox(page).fill('Ausweis');
    await attach(page);

    const thumb = mainContent(page).locator('.note-image-open').first();
    await expect(thumb).toBeVisible({ timeout: 15_000 });
    const before = await thumb.locator('img').getAttribute('src');

    await thumb.click();
    const viewer = page.locator('ion-modal.show-modal');
    await expect(viewer).toBeVisible({ timeout: 15_000 });

    await viewer.getByTestId('note-image-rotate').click();
    await expect
      .poll(async () => thumb.locator('img').getAttribute('src'), {
        timeout: 15_000,
        message: 'the rotated image was never written back to the note',
      })
      .not.toBe(before);

    await viewer.getByTestId('note-image-close').click();
    await expect(viewer).toBeHidden({ timeout: 15_000 });
  });

  test('reaches the pictures from the list by swipe, without the editor', async ({
    page,
  }) => {
    await startNote(page);
    await titleBox(page).fill('Ausweis');
    await attach(page);
    await attach(page);
    await expect(mainContent(page).locator('.note-image-open')).toHaveCount(2, {
      timeout: 15_000,
    });
    await waitForPersisted(page, 'notes', 'Ausweis');

    await page.goBack();
    const row = listRow(page, /Ausweis/);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await openRowSwipe(row, 'start');
    await row.locator('ion-item-option').first().click();

    const viewer = page.locator('ion-modal.show-modal');
    await expect(viewer).toBeVisible({ timeout: 15_000 });
    await expect(viewer.getByTestId('note-image-next')).toBeVisible();

    await viewer.getByTestId('note-image-next').click();
    await viewer.getByTestId('note-image-prev').click();
    await viewer.getByTestId('note-image-close').click();
    await expect(viewer).toBeHidden({ timeout: 15_000 });
  });

  test('lifts a pinned note into its own section, above the rest', async ({
    page,
  }) => {
    await startNote(page);
    await titleBox(page).fill('Zuerst');
    await waitForPersisted(page, 'notes', 'Zuerst');
    await page.goBack();

    await startNote(page);
    await titleBox(page).fill('Angeheftet');
    await mainContent(page)
      .locator(EDITOR_PAGE)
      .getByTestId('note-pin')
      .click();
    await waitForPersisted(page, 'notes', '"pinned":true');
    await page.goBack();

    await expect(mainContent(page).locator(NOTES_PAGE)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('list-row-title')).toHaveText([
      'Angeheftet',
      'Zuerst',
    ]);
    await expect(mainContent(page).locator('ion-list-header')).toHaveCount(2);
  });

  test('deletes a note from the editor', async ({ page }) => {
    await startNote(page);
    await titleBox(page).fill('Weg damit');
    await waitForPersisted(page, 'notes', 'Weg damit');

    await mainContent(page)
      .locator(EDITOR_PAGE)
      .getByTestId('note-delete')
      .click();
    const alert = page.locator('ion-alert');
    await expect(alert).toBeVisible({ timeout: 15_000 });
    await alert.getByRole('button', { name: 'Löschen' }).click();

    await expect(mainContent(page).locator(NOTES_PAGE)).toBeVisible({
      timeout: 30_000,
    });
    await expect(listRow(page, /Weg damit/)).toHaveCount(0);
  });
});
