import { Language, LOCALE_BY_LANGUAGE } from '../../@shared/model/app.types';

const SEPARATORS: Record<Language, { group: string; decimal: string }> = {
  de: { group: '.', decimal: ',' },
  en: { group: ',', decimal: '.' },
  fr: { group: ' ', decimal: ',' },
};

export function centsToEur(cents: number): number {
  return cents / 100;
}

export function eurToCents(
  input: string,
  language: Language = 'de'
): number | null {
  const { group, decimal } = SEPARATORS[language];
  const trimmed = input.trim();
  if (!trimmed) return null;

  const stripped = trimmed.replaceAll(/[€\s]/g, '');
  const isNegative = stripped.startsWith('-') || stripped.endsWith('-');
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

const isPlainAmount = (value: string, decimal: string): boolean =>
  new RegExp(String.raw`^\d*([${decimal}]\d*)?$`).test(value);

export function centsToInput(cents: number, language: Language = 'de'): string {
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(cents / 100);
}
