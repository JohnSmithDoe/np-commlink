/* ─── why ─────────────────────────────────────────────────────────
 * The rule builder is the app's only Signal Forms surface with a REPEATED
 * field group: each condition row binds `[formField]` to an item of the
 * `conditions` array field, and its validity comes from `applyEach`. A
 * unit spec writes the draft directly, so it can never show that those
 * per-item bindings exist at all — only driving the real controls does.
 *
 * `applyEach` is what makes a second, empty row block the save on its
 * own, and the reopen at the end is what proves each row seeds back out
 * of the stored rule with its type intact.
 *
 * Switching a row's field to `Betrag` re-reads the value already typed as
 * a threshold. `REWE` does not parse, and `matchesAmountCondition` would
 * silently treat such a rule as "never matches" — refusing to save it is
 * the honest outcome.
 *
 * An unnamed rule takes its category as the row heading, which is why the
 * saved row is found under `Kaffee`.
 *
 * `.nth(index)` on a condition row is not the ambiguity smell it usually
 * is: a row's position IS its identity within the array field.
 *
 * `pickField` drives an `interface="popover"` select, which confirms on
 * the tap — unlike the default `alert` interface, which needs its own OK.
 * ───────────────────────────────────────────────────────────────── */

import { expect, Locator, Page, test } from '@playwright/test';
import { pageRoot, waitForPersisted } from '../helpers';

const RULES = '/#/cash/rules';

function rulesPage(page: Page): Locator {
  return pageRoot(page, 'app-page-cash-rules');
}

function dialog(page: Page): Locator {
  return page.locator('ion-modal.show-modal');
}

function saveButton(page: Page): Locator {
  return dialog(page).getByRole('button', { name: /Anlegen|Übernehmen/ });
}

function valueInput(page: Page, index: number): Locator {
  return dialog(page)
    .getByTestId('rule-condition-value')
    .nth(index)
    .locator('input');
}

async function pickField(page: Page, index: number, label: string) {
  await dialog(page).getByTestId('rule-condition-field').nth(index).click();
  const popover = page.locator('ion-popover');
  await expect(popover).toBeVisible({ timeout: 10_000 });
  await popover.getByRole('radio', { name: label }).click();
  await expect(popover).toBeHidden({ timeout: 10_000 });
}

async function assignNewCategory(page: Page, name: string) {
  await dialog(page).getByTestId('category-input-trigger').click();
  const search = page.getByTestId('category-picker-search').locator('input');
  await expect(search).toBeVisible({ timeout: 10_000 });
  await search.fill(name);
  const create = page.getByText(`${name} erstellen`);
  await expect(create).toBeVisible({ timeout: 10_000 });
  await create.click();
  await expect(
    dialog(page).locator('app-category-input').getByText(name)
  ).toBeVisible({ timeout: 10_000 });
}

test.describe('cash rule builder', () => {
  test('drives the condition rows through their form fields', async ({
    page,
  }) => {
    await page.goto(RULES);
    await expect(rulesPage(page)).toBeVisible({ timeout: 30_000 });

    await rulesPage(page)
      .getByRole('button', { name: 'Regel hinzufügen' })
      .click();
    await expect(dialog(page)).toBeVisible({ timeout: 10_000 });

    await expect(saveButton(page)).toBeDisabled();

    await dialog(page).getByRole('textbox', { name: 'Name' }).fill('Kaffee');
    await assignNewCategory(page, 'Kaffee');
    await expect(saveButton(page)).toBeDisabled();

    await valueInput(page, 0).fill('REWE');
    await expect(saveButton(page)).toBeEnabled();

    await pickField(page, 0, 'Betrag');
    const note = dialog(page).getByText('Ungültiger Betrag');
    await expect(note).toBeVisible({ timeout: 10_000 });
    await expect(saveButton(page)).toBeDisabled();

    await valueInput(page, 0).fill('-25,00');
    await expect(note).toBeHidden();
    await expect(saveButton(page)).toBeEnabled();

    await dialog(page)
      .getByRole('button', { name: 'Bedingung hinzufügen' })
      .click();
    await expect(dialog(page).getByTestId('rule-condition')).toHaveCount(2);
    await expect(saveButton(page)).toBeDisabled();

    await valueInput(page, 1).fill('Soykaf');
    await expect(saveButton(page)).toBeEnabled();
    await saveButton(page).click();
    await expect(dialog(page)).toBeHidden({ timeout: 10_000 });

    await expect(
      rulesPage(page).getByRole('heading', { name: 'Kaffee' })
    ).toBeVisible({ timeout: 10_000 });
    await waitForPersisted(page, 'cash', 'Soykaf');

    await rulesPage(page).getByTestId('cash-rule-row').click();
    await expect(dialog(page)).toBeVisible({ timeout: 10_000 });
    await expect(valueInput(page, 0)).toHaveValue('-25,00');
    await expect(valueInput(page, 1)).toHaveValue('Soykaf');
    await expect(saveButton(page)).toBeEnabled();
  });
});
