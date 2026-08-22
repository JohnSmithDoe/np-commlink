/* ─── why ─────────────────────────────────────────────────────────
 * Three handbook pages share one script because they share one seed
 * path: SIGIL needs notes, COMMS needs a producer to have written into
 * the inbox (tracking is the only one that does), and GEIST needs
 * nothing at all but the probe's verdict.
 *
 * The deck shot for COMMS is taken BEFORE the inbox is opened —
 * `ionViewWillEnter` stamps `lastViewedAt`, so every unread count is
 * zero from the first visit onwards and the badge can never be
 * photographed again. It also waits out the add-toast, which otherwise
 * sits across the tile.
 *
 * Starting a tracker stops every other one, so the LAST click decides
 * which row is the running one — the seed order is the shot's content.
 *
 * The inbox is shot as an ELEMENT: the two debug buttons below the list
 * exist under `isDevMode()` only, and the dev server is the one place a
 * handbook shot would ever see them.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  addButton,
  addViaSearch,
  listRow,
  mainContent,
  openRowSwipe,
  waitForListPage,
  waitForPersisted,
} from '../helpers';
import { bootDeck, openPage, shot, shotOf } from './shot';

const NOTES_PAGE = 'app-page-notes';
const EDITOR_PAGE = 'app-page-note-editor';
const IMAGE_FIXTURE = 'e2e/notes/note-image.png';

const editor = (page: Page): Locator =>
  mainContent(page).locator(EDITOR_PAGE).last();

const titleBox = (page: Page): Locator =>
  editor(page).locator('[data-testid="note-title"] input');

const bodyBox = (page: Page): Locator =>
  editor(page).locator('[data-testid="note-body"] textarea');

const startNote = async (page: Page): Promise<void> => {
  await addButton(mainContent(page).locator(NOTES_PAGE)).click();
  await expect(editor(page)).toBeVisible();
};

const writeNote = async (
  page: Page,
  title: string,
  body: string
): Promise<void> => {
  await startNote(page);
  await titleBox(page).fill(title);
  await bodyBox(page).fill(body);
  await waitForPersisted(page, 'notes', title);
};

test('sigil — notes, editor, swipes and viewer', async ({ page }) => {
  await bootDeck(page);
  await openPage(page, 'notes', NOTES_PAGE);

  await writeNote(
    page,
    'Einkauf Samstag',
    'Milch, Brot, Kaffee — und Zahnpasta nicht vergessen.'
  );
  await editor(page).getByTestId('note-pin').click();
  await waitForPersisted(page, 'notes', '"pinned":true');
  await page.goBack();

  await writeNote(
    page,
    'Zahnarzt',
    'Termin am 3. September, 09:30 Uhr. Versicherungskarte einstecken.'
  );
  await page.goBack();

  await writeNote(
    page,
    'Ausweis',
    'Foto für die Anmeldung im Bürgerbüro — Rückseite fehlt noch.'
  );
  await page
    .locator(`${EDITOR_PAGE} input[type="file"]`)
    .last()
    .setInputFiles(IMAGE_FIXTURE);
  await expect(editor(page).locator('.note-image-open')).toHaveCount(1);
  await waitForPersisted(page, 'notes', 'Bürgerbüro');
  await shot(page, 'sigil-editor');

  await page.goBack();
  await expect(mainContent(page).locator(NOTES_PAGE)).toBeVisible();
  await expect(page.getByTestId('list-row')).toHaveCount(3);
  await shot(page, 'sigil-liste');

  const withImage = listRow(page, /Ausweis/);
  await openRowSwipe(withImage, 'start');
  await shot(page, 'sigil-wischen-bilder');

  await withImage.locator('ion-item-option').first().click();
  const viewer = page.locator('ion-modal.show-modal');
  await expect(viewer).toBeVisible();
  await shot(page, 'sigil-bildansicht');
  await viewer.getByTestId('note-image-close').click();
  await expect(viewer).toBeHidden();

  const plain = listRow(page, /Zahnarzt/);
  await openRowSwipe(plain, 'end');
  await shot(page, 'sigil-wischen-loeschen');
});

test('comms — inbox written from another module', async ({ page }) => {
  await bootDeck(page);

  await page.goto('/#/tracking');
  await waitForListPage(page);
  for (const name of ['Kundenprojekt', 'Doku schreiben', 'Meeting'])
    await addViaSearch(page, name);

  const tracker = (name: string): Locator =>
    page.locator('#main-content app-tracking-item').filter({ hasText: name });

  for (const name of ['Kundenprojekt', 'Doku schreiben', 'Meeting']) {
    await expect(tracker(name)).toBeVisible();
    await tracker(name).click();
  }
  await waitForPersisted(page, 'notifications', 'Meeting läuft');

  await openPage(page, 'commlink', 'app-page-commlink');
  const tile = page
    .getByTestId('deck-tile')
    .filter({ hasText: 'COMMS' })
    .first();
  await expect(tile.getByTestId('deck-tile-badge')).toBeVisible();
  await expect(page.locator('ion-toast:not(.overlay-hidden)')).toHaveCount(0);
  await shotOf(tile, 'comms-deck-kachel');

  const inbox = await openPage(page, 'notifications', 'app-page-notifications');
  await expect(
    inbox.getByTestId('notification-row').filter({ hasText: 'Meeting' })
  ).toBeVisible();
  await shotOf(inbox.locator('ion-list'), 'comms-posteingang');

  await inbox
    .getByTestId('notification-row')
    .filter({ hasText: 'Kundenprojekt' })
    .getByRole('button', { name: 'Erledigt' })
    .click();
  await inbox
    .locator('.section-header')
    .filter({ hasText: 'Erledigt' })
    .click();
  await shotOf(inbox.locator('ion-list'), 'comms-erledigt');
});

test('geist — whatever the local model probe reports', async ({ page }) => {
  await bootDeck(page);
  const geist = await openPage(page, 'geist', 'app-page-geist');
  await expect(geist.locator('.gs-panel, .gs-console')).toBeVisible();
  await page.waitForTimeout(2000);
  await shot(page, 'geist-status');

  await openPage(page, 'commlink', 'app-page-commlink');
  const tile = page
    .getByTestId('deck-tile')
    .filter({ hasText: 'GEIST' })
    .first();
  await expect(tile).toBeVisible();
  await shotOf(tile, 'geist-deck-kachel');
});
