/* ─── why ─────────────────────────────────────────────────────────
 * The emoji picker is gated to `Platform.is('desktop')` — a phone
 * keyboard already has one — so its trigger does not render on the Pixel
 * 5 the rest of the suite emulates. `e2e/desktop/` is the only path the
 * `desktop-chromium` project matches and the only one `mobile-chromium`
 * ignores, which is why this one spec lives apart. The mirror image, the
 * trigger being ABSENT on a phone, is asserted from `storage.e2e.ts`.
 *
 * The picker is an `ion-modal` of its own presented over another, so it
 * ends up a SIBLING of the edit dialog at the app root rather than a
 * descendant of it. Both are therefore keyed off their own title.
 *
 * The picker no longer closes on a pick, so the whole sequence costs one
 * open — and that is the point of the spec. Two glyphs and a ⌫ without a
 * dismiss in between is the case the browser alone can falsify: the caret
 * is TypeScript's while the modal lives, and only a real Ionic render can
 * show whether it survives one. The caret never leaves the picker — the
 * name field is read last as proof that the TEXT did.
 *
 * The edit dialog leaves the name field's selection at its end, so the
 * seeded caret puts the glyphs AFTER the name. The exact string is
 * asserted rather than a regex: it is the seed that is under test.
 *
 * The last assertion is the recents store: saving records the glyphs, so
 * the next open offers them with no search at all.
 *
 * The second test buys the case a point-caret cannot express. Selection
 * is why the picker reads a RANGE off the preview, and it is only
 * observable in a browser: the range math is unit-tested, but that the
 * selection SURVIVES clicking a button — blur does not collapse it — is a
 * browser fact. Shift+Arrow for the same reason: it is a user gesture.
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

function previewBox(page: Page): Locator {
  return picker(page).getByTestId('emoji-picker-preview').locator('input');
}

function searchPicker(page: Page, query: string): Promise<void> {
  return picker(page)
    .getByTestId('emoji-picker-search')
    .locator('input')
    .fill(query);
}

function pickEmoji(page: Page, glyph: string): Locator {
  return picker(page).getByTestId('emoji-option').filter({ hasText: glyph });
}

function recentEmoji(page: Page, glyph: string): Locator {
  return picker(page).getByTestId('emoji-recent').filter({ hasText: glyph });
}

test.describe('emoji picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/household/storage');
    await waitForListPage(page);
  });

  test('inserts several emoji in one visit and remembers them', async ({
    page,
  }) => {
    await addViaSearch(page, 'Milk');
    await listRow(page, /Milk/).click();
    await expect(editDialog(page)).toBeVisible({ timeout: 10_000 });

    await editDialog(page).getByTestId('emoji-picker-trigger').click();
    await expect(picker(page)).toBeVisible({ timeout: 10_000 });
    await expect(previewBox(page)).toHaveValue('Milk', { timeout: 10_000 });

    await searchPicker(page, 'milch');
    await expect(pickEmoji(page, '🥛')).toBeVisible({ timeout: 10_000 });
    await pickEmoji(page, '🥛').click();
    await expect(picker(page)).toBeVisible();
    await expect(previewBox(page)).toHaveValue('Milk🥛', { timeout: 10_000 });

    await searchPicker(page, 'reis');
    await expect(pickEmoji(page, '🌾')).toBeVisible({ timeout: 10_000 });
    await pickEmoji(page, '🌾').click();
    await expect(previewBox(page)).toHaveValue('Milk🥛🌾', { timeout: 10_000 });

    await picker(page).getByTestId('emoji-picker-backspace').click();
    await expect(previewBox(page)).toHaveValue('Milk🥛', { timeout: 10_000 });

    await previewBox(page).click();
    await page.keyboard.press('Home');
    await pickEmoji(page, '🌾').click();
    await expect(previewBox(page)).toHaveValue('🌾Milk🥛', { timeout: 10_000 });

    await picker(page).getByRole('button', { name: 'Fertig' }).click();
    await expect(picker(page)).toBeHidden({ timeout: 10_000 });
    await expect(nameBox(page)).toHaveValue('🌾Milk🥛', { timeout: 10_000 });

    await editDialog(page).getByRole('button', { name: 'Übernehmen' }).click();
    await expect(listRow(page, /🌾Milk🥛/)).toBeVisible({ timeout: 10_000 });

    await addViaSearch(page, 'Butter');
    await listRow(page, /Butter/).click();
    await editDialog(page).getByTestId('emoji-picker-trigger').click();
    await expect(recentEmoji(page, '🥛')).toBeVisible({ timeout: 10_000 });
  });

  test('replaces a selection instead of editing beside it', async ({
    page,
  }) => {
    await addViaSearch(page, 'Vollmilch');
    await listRow(page, /Vollmilch/).click();
    await expect(editDialog(page)).toBeVisible({ timeout: 10_000 });

    await editDialog(page).getByTestId('emoji-picker-trigger').click();
    await expect(previewBox(page)).toHaveValue('Vollmilch', {
      timeout: 10_000,
    });

    await previewBox(page).click();
    await page.keyboard.press('Home');
    for (let index = 0; index < 4; index++) {
      await page.keyboard.press('Shift+ArrowRight');
    }
    await picker(page).getByTestId('emoji-picker-backspace').click();
    await expect(previewBox(page)).toHaveValue('milch', { timeout: 10_000 });

    await searchPicker(page, 'milch');
    await expect(pickEmoji(page, '🥛')).toBeVisible({ timeout: 10_000 });
    await previewBox(page).click();
    await page.keyboard.press('ControlOrMeta+a');
    await pickEmoji(page, '🥛').click();
    await expect(previewBox(page)).toHaveValue('🥛', { timeout: 10_000 });
  });
});
