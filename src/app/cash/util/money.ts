/**
 * Money helpers for the cash ledger — integer cents in, localized string at the
 * view edge. de-DE for now: the whole app is hardwired German (`LOCALE_ID`,
 * `dayjs.locale`, `registerLocaleData`) and `en.json` is dead until a language
 * switcher lands. Display routes through `MoneyEurPipe`, which delegates here so
 * the locale lives in ONE place when i18n is wired. See docs/cash-plan.md →
 * "Money parsing & formatting".
 */

const DEFAULT_LOCALE = 'de-DE';

/** Cents → euros as a number. For chart/adapter code only; never for display. */
export function centsToEur(cents: number): number {
  return cents / 100;
}

/**
 * Parse a user-typed euro amount into signed integer cents, or `null` if it is
 * not a valid amount. de-DE convention: `.` is a thousands separator and `,` the
 * decimal, so `"1.234,56"` → `123456` and `"12"` → `1200`. Integer-cent-safe —
 * no float multiply. A leading `-`, a `€` sign and whitespace are tolerated; a
 * stray second separator or any non-numeric junk yields `null`.
 */
export function eurToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const sign = trimmed.startsWith('-') ? -1 : 1;
  // Drop the sign, currency symbol, whitespace and thousands separators; what
  // remains must be digits with at most one decimal comma.
  const cleaned = trimmed
    .replace(/^[+-]/, '')
    .replace(/[€\s]/g, '')
    .replace(/\./g, '');
  if (cleaned === '' || cleaned === ',' || !/^\d*,?\d*$/.test(cleaned)) {
    return null;
  }

  const [intPart, decPart = ''] = cleaned.split(',');
  const decCents = Number((decPart + '00').slice(0, 2));
  const cents = Number(intPart || '0') * 100 + decCents;
  return sign * cents;
}

/**
 * Signed integer cents → the plain de-DE decimal a user edits, without grouping
 * or currency symbol (e.g. `1234` → `"12,34"`). Round-trips through `eurToCents`.
 */
export function centsToInput(cents: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(cents / 100);
}

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
