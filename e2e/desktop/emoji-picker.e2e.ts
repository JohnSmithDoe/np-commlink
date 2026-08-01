import { expect, Locator, Page, test } from '@playwright/test';
import {
  addViaSearch,
  listRow,
  presentedDialog,
  waitForListPage,
} from '../helpers';

/**
 * The emoji picker is gated to desktop (`Platform.is('desktop')`) — a mobile
 * keyboard already has one — so its trigger does not render on the Pixel 5 the
 * rest of the suite emulates. This file lives under `e2e/desktop/`, which is the
 * only path the `desktop-chromium` project matches and the only one
 * `mobile-chromium` ignores. Its mirror image (the trigger being ABSENT on a
 * phone) is asserted from the mobile project, in the storage spec.
 */
function editDialog(page: Page): Locator {
  return presentedDialog(page, 'Eintrag bearbeiten');
}

function nameBox(page: Page): Locator {
  return editDialog(page).getByRole('textbox', { name: 'Name' });
}

/** The picker is its own ion-modal, so it teleports to the app root and is NOT
 * inside `editDialog` — key it off its own title. */
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
    await page.goto('/#/groceries/storage/_storage');
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

    // `multiple`: the picker stays up, so a second glyph goes in without
    // reopening — and lands AFTER the first, which is what the caret advance
    // buys (a stale caret would spell "🌾🥛").
    await expect(picker(page)).toBeVisible();
    await searchPicker(page, 'reis');
    await expect(emojiOption(page, '🌾')).toBeVisible({ timeout: 10_000 });
    await emojiOption(page, '🌾').click();

    await picker(page).getByRole('button', { name: 'Schließen' }).click();
    await expect(picker(page)).toBeHidden({ timeout: 10_000 });

    await expect(nameBox(page)).toHaveValue(/🥛🌾/, { timeout: 10_000 });
    await editDialog(page).getByRole('button', { name: 'Übernehmen' }).click();
    await expect(listRow(page, /🥛🌾/)).toBeVisible({ timeout: 10_000 });

    // Saving records the glyphs, so the next open offers them without a search.
    await addViaSearch(page, 'Butter');
    await listRow(page, /Butter/).click();
    await editDialog(page).getByTestId('emoji-picker-trigger').click();
    await expect(emojiOption(page, '🥛').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
