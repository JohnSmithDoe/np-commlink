import { expect, Locator, Page, test } from '@playwright/test';
import { mainContent } from '../helpers';
import { JAM_SERVER, stubJamserve } from './jam-stub';
import { bootDeck, openPage, shot, shotOf } from './shot';

const HOME_PAGE = 'app-page-music-home';
const SOURCES_PAGE = 'app-page-music-sources';
const LIBRARY_PAGE = 'app-page-music-library';
const ALBUM_PAGE = 'app-page-music-album';
const QUEUE_PAGE = 'app-page-music-queue';

const field = (root: Locator, label: string): Locator =>
  root.locator('ion-input').filter({ hasText: label }).locator('input');

const visiblePage = (page: Page, selector: string): Locator =>
  mainContent(page).locator(`${selector}:not(.ion-page-hidden)`).last();

const connect = async (page: Page): Promise<void> => {
  const sources = await openPage(page, 'music/sources', SOURCES_PAGE);
  await field(sources, 'Server-Adresse').fill(JAM_SERVER);
  await field(sources, 'Benutzername').fill('rita');
  await field(sources, 'Passwort').fill('geheim');
  await shot(page, 'simsense-quellen');

  await sources.getByRole('button', { name: 'Verbinden' }).click();
  await expect(sources.getByText(/Angemeldet als rita/)).toBeVisible();
  await shot(page, 'simsense-verbunden');
};

test('simsense — sources, home, library, album and queue', async ({ page }) => {
  await stubJamserve(page);
  await bootDeck(page);

  const empty = await openPage(page, 'music/home', HOME_PAGE);
  await expect(empty.getByText('Noch keine Musikquelle')).toBeVisible();
  await shot(page, 'simsense-leer');

  await connect(page);

  const home = await openPage(page, 'music/home', HOME_PAGE);
  await expect(home.getByText('Zuletzt gehört')).toBeVisible();
  await expect(home.getByText('Sonntagmorgen')).toBeVisible();
  await expect(home.locator('app-music-cover img').first()).toBeVisible();
  await shot(page, 'simsense-start');

  const library = await openPage(page, 'music/library', LIBRARY_PAGE);
  await library.locator('ion-segment-button[value="albums"]').click();
  await expect(library.getByText('Kobaltblau')).toBeVisible();
  await expect(library.locator('app-music-cover img').first()).toBeVisible();
  await shot(page, 'simsense-bibliothek');

  await library.getByRole('button', { name: /Nachtschicht/ }).click();
  const album = visiblePage(page, ALBUM_PAGE);
  await expect(album.getByText('Leuchtreklame')).toBeVisible();
  await album.getByRole('button', { name: 'Alle abspielen' }).click();
  await expect(album.locator('app-music-player-bar .bar')).toBeVisible();
  await shot(page, 'simsense-album');

  await album.locator('app-music-player-bar .bar__track').click();
  const queue = visiblePage(page, QUEUE_PAGE);
  await expect(queue.getByText('Morgengrau')).toBeVisible();
  await shot(page, 'simsense-warteschlange');

  await openPage(page, 'commlink', 'app-page-commlink');
  const tile = page
    .getByTestId('deck-tile')
    .filter({ hasText: 'SIMSENSE' })
    .first();
  await expect(tile).toBeVisible();
  await shotOf(tile, 'simsense-deck-kachel');
});
