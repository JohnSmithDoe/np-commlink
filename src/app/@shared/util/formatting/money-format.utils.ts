/* ─── why ─────────────────────────────────────────────────────────
 * Negative zero is normalised away before formatting. An outflow is rendered
 * as a negated magnitude, so a figure that happens to be nothing arrives here
 * as `-0` and `Intl` spells that "-0,00 €".
 * ───────────────────────────────────────────────────────────────── */
const DEFAULT_LOCALE = 'de-DE';

export function formatEur(
  cents: number,
  locale: string = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(cents === 0 ? 0 : cents / 100);
}
