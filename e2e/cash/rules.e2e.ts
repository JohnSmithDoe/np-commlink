import { expect, Locator, Page, test } from '@playwright/test';
import { waitForPersisted } from '../helpers';

/**
 * The rule builder is the app's only Signal Forms surface with a **repeated**
 * field group: every condition row binds `[formField]` to an item of the
 * `conditions` array field, and its validity comes from `applyEach`. A unit spec
 * writes the draft directly and so never proves the array bindings exist — this
 * drives them through the real controls: type into a row, switch its field via
 * the ion-select, watch the per-row error note appear and the save button follow.
 */

const RULES = '/#/cash/rules';

function rulesPage(page: Page): Locator {
  return page.locator('#main-content app-page-cash-rules');
}

function dialog(page: Page): Locator {
  return page.locator('app-cash-rule-edit-modal');
}

function saveButton(page: Page): Locator {
  return dialog(page).getByRole('button', { name: 'Speichern' });
}

/** The value input of condition row `index` — the index IS the semantic here. */
function valueInput(page: Page, index: number): Locator {
  return dialog(page)
    .getByTestId('rule-condition-value')
    .nth(index)
    .locator('input');
}

/**
 * Pick from a `interface="popover"` ion-select: click the HOST (its shadow
 * `part="inner"` swallows a click aimed at the accessible button), then the
 * option — single-select popovers confirm and close on the tap.
 */
async function pickField(page: Page, index: number, label: string) {
  await dialog(page).getByTestId('rule-condition-field').nth(index).click();
  const popover = page.locator('ion-popover');
  await expect(popover).toBeVisible({ timeout: 10_000 });
  await popover.getByRole('radio', { name: label }).click();
  await expect(popover).toBeHidden({ timeout: 10_000 });
}

/** Create the category the rule assigns, through the picker's create row. */
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

    // A blank rule is unsaveable: no category, and one empty condition value.
    await expect(saveButton(page)).toBeDisabled();

    await assignNewCategory(page, 'Kaffee');
    await expect(saveButton(page)).toBeDisabled();

    await valueInput(page, 0).fill('REWE');
    await expect(saveButton(page)).toBeEnabled();

    // Switching the row to `amount` re-reads the same value as a threshold —
    // 'REWE' does not parse, and `matchesAmountCondition` would treat such a
    // rule as "never matches", so it must not be saveable.
    await pickField(page, 0, 'Betrag');
    const note = dialog(page).getByText('Ungültiger Betrag');
    await expect(note).toBeVisible({ timeout: 10_000 });
    await expect(saveButton(page)).toBeDisabled();

    await valueInput(page, 0).fill('-25,00');
    await expect(note).toBeHidden();
    await expect(saveButton(page)).toBeEnabled();

    // A second row is empty, so it blocks the save on its own.
    await dialog(page)
      .getByRole('button', { name: 'Bedingung hinzufügen' })
      .click();
    await expect(dialog(page).getByTestId('rule-condition')).toHaveCount(2);
    await expect(saveButton(page)).toBeDisabled();

    await valueInput(page, 1).fill('Soykaf');
    await expect(saveButton(page)).toBeEnabled();
    await saveButton(page).click();
    await expect(dialog(page)).toBeHidden({ timeout: 10_000 });

    // An unnamed rule takes its category as the row heading.
    await expect(
      rulesPage(page).getByRole('heading', { name: 'Kaffee' })
    ).toBeVisible({ timeout: 10_000 });
    await waitForPersisted(page, 'cash', 'Soykaf');

    // Re-open: both rows must seed back from the stored rule, the numeric one
    // still numeric — which is what proves the bindings round-trip.
    await rulesPage(page).getByTestId('cash-rule-row').click();
    await expect(dialog(page)).toBeVisible({ timeout: 10_000 });
    await expect(valueInput(page, 0)).toHaveValue('-25,00');
    await expect(valueInput(page, 1)).toHaveValue('Soykaf');
    await expect(saveButton(page)).toBeEnabled();
  });
});
