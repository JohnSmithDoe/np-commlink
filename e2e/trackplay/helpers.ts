/* ─── why ─────────────────────────────────────────────────────────
 * A fresh browser context starts trackplay with no players and no games,
 * but NOT with no game types: the reducer seeds Standard, Rommé and Skat
 * on `loaded`, so a spec may pick one without creating it.
 *
 * Everything re-exported below is defined in the suite-wide helpers, not
 * here: none of it is trackplay's — the page scope, the shared edit
 * modal's copy, the add button, an `ion-select` in a dialog — while this
 * suite's specs keep one import.
 *
 * `headerTitle` takes a page scope rather than the whole content area:
 * every mounted page renders a title, so the unscoped locator needed a
 * `.first()` that could just as easily read the stale page's.
 *
 * A player is a person, so `createPlayer` creates one in the people program
 * and lands back on the players page.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page } from '@playwright/test';
import {
  addButton,
  createDialog,
  CREATE_BUTTON,
  gotoPage,
  mainContent,
  moduleTab,
  nameBox,
  pageRoot,
  pickSelectOption,
} from '../helpers';
import { createPerson } from '../people/helpers';

export {
  addButton,
  createDialog,
  CREATE_BUTTON,
  gotoPage,
  mainContent,
  moduleTab,
  nameBox,
  pageRoot,
  pickSelectOption,
};

export function headerTitle(scope: Locator): Locator {
  return scope.getByTestId('page-header-title');
}

export const PLAYERS_PAGE = 'app-page-trackplay-players';

export async function createPlayer(page: Page, name: string): Promise<void> {
  await createPerson(page, name);
  await gotoPage(page, 'trackplay/players', PLAYERS_PAGE);
  await expect(
    pageRoot(page, PLAYERS_PAGE).getByText(name, { exact: true })
  ).toBeVisible();
}

export async function togglePlayerInSelect(
  dialog: Locator,
  name: string
): Promise<void> {
  const row = dialog.getByTestId('player-select-row').filter({ hasText: name });
  await row.getByTestId('player-select-checkbox').click();
}
