/**
 * Money formatting shared by 2+ domains — `cash` (its ledger, via
 * `MoneyEurPipe`) and `commlink` (the deck's themed currency label). Both pass
 * the active locale; the de-DE default is the language every amount was written
 * in. Cash-specific parsing/input helpers (`eurToCents`, `centsToInput`, …) stay
 * in `cash/util/money.utils.ts` — only this display formatter is genuinely
 * shared, and only *formatting* can take a locale safely: parsing cannot, since
 * the two conventions read each other's amounts as valid (see there).
 */

const DEFAULT_LOCALE = 'de-DE';

/** Signed integer cents → localized currency string, e.g. `1234` → `"12,34 €"`. */
export function formatEur(
  cents: number,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
