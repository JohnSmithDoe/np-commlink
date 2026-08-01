import { LOCALE_BY_LANGUAGE, TLanguage } from '../../@shared/model/app.types';

/**
 * Money helpers for the cash ledger — integer cents in, parsed/edited at the
 * view edge. Both directions take the language, because the separators swap
 * roles between them: `1.234,56` and `1,234.56` are the same amount, and reading
 * one with the other's convention is off by a factor of a thousand. Display
 * formatting (`formatEur`) lives in `@shared/util/money.utils` once `commlink`
 * needed it too. See docs/cash.md §7.3 → "Money parsing takes the
 * language explicitly".
 */

// The separator pair per language. A table rather than a branch, so a third
// language is data — and so the parser and the formatter cannot disagree about
// which character means what.
const SEPARATORS: Record<TLanguage, { group: string; decimal: string }> = {
  de: { group: '.', decimal: ',' },
  en: { group: ',', decimal: '.' },
};

/** Cents → euros as a number. For chart/adapter code only; never for display. */
export function centsToEur(cents: number): number {
  return cents / 100;
}

/**
 * Parse a user-typed euro amount into signed integer cents, or `null` if it is
 * not a valid amount. Integer-cent-safe — no float multiply. A `-` is tolerated
 * leading or trailing (e.g. `"-12"` and `"12-"`, or either side of a `€` sign),
 * and a `€` sign and whitespace are tolerated anywhere; a stray second separator
 * or any non-numeric junk yields `null`.
 *
 * Under `de` (the default) `"1.234,56"` → `123456` and `"12"` → `1200`; under
 * `en` the same amount is written `"1,234.56"`.
 */
export function eurToCents(
  input: string,
  language: TLanguage = 'de'
): number | null {
  const { group, decimal } = SEPARATORS[language];
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Drop the currency symbol and whitespace first, so a '-' next to either is
  // still found regardless of position.
  const stripped = trimmed.replaceAll(/[€\s]/g, '');
  const isNegative = stripped.startsWith('-') || stripped.endsWith('-');
  // What remains, sign and group separators dropped, must be digits with at
  // most one decimal separator.
  const cleaned = stripped
    .replace(/^[+-]/, '')
    .replace(/-$/, '')
    .replaceAll(group, '');
  if (cleaned === '' || cleaned === decimal || !isPlainAmount(cleaned, decimal))
    return null;

  const [intPart, decPart = ''] = cleaned.split(decimal);
  const decCents = Number((decPart + '00').slice(0, 2));
  const cents = Number(intPart || '0') * 100 + decCents;
  return (isNegative ? -1 : 1) * cents;
}

// The separator goes in a character class, where `.` is literal. Interpolated
// bare it would be the regex metacharacter and match any single character, so
// `1x23` would read as an amount.
const isPlainAmount = (value: string, decimal: string): boolean =>
  new RegExp(String.raw`^\d*([${decimal}]\d*)?$`).test(value);

/**
 * Signed integer cents → the plain decimal a user edits, without grouping or
 * currency symbol (e.g. `1234` → `"12,34"` under `de`). Round-trips through
 * `eurToCents` for the same language.
 */
export function centsToInput(
  cents: number,
  language: TLanguage = 'de'
): string {
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(cents / 100);
}
