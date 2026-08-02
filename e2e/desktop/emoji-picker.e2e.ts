/* ─── why ─────────────────────────────────────────────────────────
 * The emoji picker is gated to `Platform.is('desktop')` — a phone
 * keyboard already has one — so its trigger does not render on the Pixel
 * 5 the rest of the suite emulates. `e2e/desktop/` is the only path the
 * `desktop-chromium` project matches and the only one `mobile-chromium`
 * ignores, which is why this one spec lives apart. Its mirror image, the
 * trigger being ABSENT on a phone, is asserted from the mobile project in
 * `e2e/household/storage.e2e.ts`.
 *
 * The picker is an `ion-modal` of its own presented over another, so it
 * ends up a SIBLING of the edit dialog at the app root rather than a
 * descendant of it. Both are therefore keyed off their own title.
 *
 * The two-glyph sequence is the point of the middle assertions: with
 * `multiple` the picker stays up, and the second glyph must land AFTER
 * the first. That is what the caret advance buys — a stale caret spells
 * "🌾🥛".
 *
 * The last assertion is the recents store: saving records the glyphs, so
 * the next open offers them with no search at all.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import {
  addViaSearch,
  listRow,
  presentedDialog,
  waitForListPage,
} from '../helpers';

function editDialog(page: Page): Locator {
  return presentedDialog(page, 'Eintrag bearbeiten');
}

function nameBox(page: Page): Locator {
  return editDialog(page).getByRole('textbox', { name: 'Name' });
}

function picker(page: Page): Locator {
  return presentedDialog(page, 'Emoji auswählen');
}

function searchPicker(page: Page, query: string): Promise<void> {
  return picker(page)
    .getByTestId('emoji-picker-search')
    .locator('input')
    .fill(query);
}

function emojiOption(page: Page, glyph: string): Locator {
  return picker(page).getByTestId('emoji-option').filter({ hasText: glyph });
}

test.describe('emoji picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/household/storage/_storage');
    await waitForListPage(page);
  });

  test('picks emoji into the name and remembers them', async ({ page }) => {
    await addViaSearch(page, 'Milk');
    await listRow(page, /Milk/).click();
    await expect(editDialog(page)).toBeVisible({ timeout: 10_000 });

    await editDialog(page).getByTestId('emoji-picker-trigger').click();
    await expect(picker(page)).toBeVisible({ timeout: 10_000 });

    await searchPicker(page, 'milch');
    await expect(emojiOption(page, '🥛')).toBeVisible({ timeout: 10_000 });
    await emojiOption(page, '🥛').click();

    await expect(picker(page)).toBeVisible();
    await searchPicker(page, 'reis');
    await expect(emojiOption(page, '🌾')).toBeVisible({ timeout: 10_000 });
    await emojiOption(page, '🌾').click();

    await picker(page).getByRole('button', { name: 'Schließen' }).click();
    await expect(picker(page)).toBeHidden({ timeout: 10_000 });

    await expect(nameBox(page)).toHaveValue(/🥛🌾/, { timeout: 10_000 });
    await editDialog(page).getByRole('button', { name: 'Übernehmen' }).click();
    await expect(listRow(page, /🥛🌾/)).toBeVisible({ timeout: 10_000 });

    await addViaSearch(page, 'Butter');
    await listRow(page, /Butter/).click();
    await editDialog(page).getByTestId('emoji-picker-trigger').click();
    await expect(emojiOption(page, '🥛').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
