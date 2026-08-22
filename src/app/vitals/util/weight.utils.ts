import { Language, LOCALE_BY_LANGUAGE } from '../../@shared/model/app.types';

const GRAMS_PER_KG = 1000;
const GRAMS_PER_STEP = 100;
const FRACTION_DIGITS = 1;
const NON_NUMERIC = /[^\d.]/;

export const gramsToKg = (grams: number): number => grams / GRAMS_PER_KG;

export const kgToGrams = (kg: number): number =>
  Math.round((kg * GRAMS_PER_KG) / GRAMS_PER_STEP) * GRAMS_PER_STEP;

export function inputToGrams(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.').replaceAll(/\s|kg/gi, '');
  if (cleaned === '' || NON_NUMERIC.test(cleaned)) return null;
  const kg = Number(cleaned);
  return Number.isFinite(kg) ? kgToGrams(kg) : null;
}

export function formatKg(
  grams: number,
  language: Language = 'de',
  signed = false
): string {
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    minimumFractionDigits: FRACTION_DIGITS,
    maximumFractionDigits: FRACTION_DIGITS,
    signDisplay: signed ? 'exceptZero' : 'auto',
    useGrouping: false,
  }).format(gramsToKg(grams));
}

export const gramsToInput = (
  grams: number | null,
  language: Language = 'de'
): string => (grams === null ? '' : formatKg(grams, language));
