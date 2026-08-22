/* ─── why ─────────────────────────────────────────────────────────
 * The page carries THREE `ion-segment`s whose buttons are
 * indistinguishable by element name, so every pick is scoped by the
 * segment's own `aria-labelledby` — the same reason `settings/language.e2e`
 * gives for its testid.
 *
 * The accent swatch is a native `input[type=color]`: its picker is an OS
 * surface Playwright cannot open or capture, so the custom hue is written
 * onto the input and the `change` the component listens to is dispatched —
 * the same handler the OS picker's OK would reach.
 *
 * Skin and mode land in separate tests because `setMode` DROPS a custom
 * accent, and one context per test is the cheapest way to keep the accent
 * shot from depending on the order of the brightness shot.
 * ───────────────────────────────────────────────────────────────── */
import { expect, Locator, Page, test } from '@playwright/test';
import { waitForPersisted } from '../helpers';
import { bootDeck, openPage, shot } from './shot';

const CUSTOM_PRIMARY = '#ff4d6d';

const segment = (root: Locator, label: string): Locator =>
  root.locator(`ion-segment[aria-labelledby="${label}-picker-label"]`);

async function pick(
  root: Locator,
  label: string,
  option: string
): Promise<void> {
  await segment(root, label)
    .locator('ion-segment-button')
    .filter({ hasText: option })
    .click();
}

async function openSettings(page: Page): Promise<Locator> {
  const root = await openPage(page, 'settings', 'app-page-settings');
  await expect(root.getByText('Darstellung', { exact: true })).toBeVisible();
  return root;
}

test('settings in the cyberpunk skin, and its accent picker', async ({
  page,
}) => {
  const root = await openSettings(page);
  await shot(page, 'sysop-cyberpunk');

  const primary = root.locator('input[type="color"]').first();
  await primary.scrollIntoViewIfNeeded();
  await primary.evaluate((input: HTMLInputElement, hex: string) => {
    input.value = hex;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, CUSTOM_PRIMARY);
  await waitForPersisted(page, 'settings', CUSTOM_PRIMARY);
  await root
    .getByText('Zurücksetzen', { exact: true })
    .scrollIntoViewIfNeeded();
  await shot(page, 'sysop-akzent');

  await root.getByText('Quellcode', { exact: true }).scrollIntoViewIfNeeded();
  await shot(page, 'sysop-lizenz');
});

test('the same page in the plain skin, and the deck behind it', async ({
  page,
}) => {
  await bootDeck(page);
  const root = await openSettings(page);

  await pick(root, 'theme', 'OKBoomer');
  await waitForPersisted(page, 'settings', 'boomer');
  await expect(root.getByText('Darstellung', { exact: true })).toBeVisible();
  await shot(page, 'sysop-boomer');

  await pick(root, 'mode', 'Hell');
  await waitForPersisted(page, 'settings', 'light');
  await shot(page, 'sysop-hell');

  await openPage(page, 'commlink', 'app-page-commlink');
  await shot(page, 'sysop-deck-boomer');
});
