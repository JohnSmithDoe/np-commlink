/**
 * Money helpers for the cash ledger — integer cents in, parsed/edited at the
 * view edge. de-DE for now: the whole app is hardwired German (`LOCALE_ID`,
 * `dayjs.locale`, `registerLocaleData`) and `en.json` is dead until a language
 * switcher lands. Display formatting (`formatEur`) moved to
 * `@shared/util/money.utils` once `commlink` needed it too. See
 * docs/cash-plan.md → "Money parsing & formatting".
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
 * no float multiply. A `-` is tolerated leading or trailing (e.g. `"-12"` and
 * `"12-"`, or either side of a `€` sign), and a `€` sign and whitespace are
 * tolerated anywhere; a stray second separator or any non-numeric junk yields
 * `null`.
 */
export function eurToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Drop the currency symbol and whitespace first, so a '-' next to either is
  // still found regardless of position.
  const stripped = trimmed.replaceAll(/[€\s]/g, '');
  const isNegative = stripped.startsWith('-') || stripped.endsWith('-');
  // What remains, sign and thousands separators dropped, must be digits with
  // at most one decimal comma.
  const cleaned = stripped
    .replace(/^[+-]/, '')
    .replace(/-$/, '')
    .replaceAll('.', '');
  if (cleaned === '' || cleaned === ',' || !/^\d*(,\d*)?$/.test(cleaned)) {
    return null;
  }

  const [intPart, decPart = ''] = cleaned.split(',');
  const decCents = Number((decPart + '00').slice(0, 2));
  const cents = Number(intPart || '0') * 100 + decCents;
  return (isNegative ? -1 : 1) * cents;
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
