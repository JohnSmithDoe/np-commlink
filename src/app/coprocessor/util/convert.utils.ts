import { Language, LOCALE_BY_LANGUAGE } from '../../@shared/model/app.types';
import { Unit } from '../model/units.types';

const SIGNIFICANT_DIGITS = 6;
const NOISE_DIGITS = 12;

const toBase = (value: number, unit: Unit): number =>
  value * unit.factor + (unit.offset ?? 0);

const fromBase = (base: number, unit: Unit): number =>
  (base - (unit.offset ?? 0)) / unit.factor;

export const convert = (value: number, from: Unit, to: Unit): number =>
  fromBase(toBase(value, from), to);

export const formatNumber = (value: number, language: Language): string =>
  new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    maximumSignificantDigits: SIGNIFICANT_DIGITS,
  }).format(Number(value.toPrecision(NOISE_DIGITS)));

const readableIn = (base: number, unit: Unit): number =>
  Math.abs(fromBase(base, unit));

const largest = (candidates: readonly Unit[]): Unit | undefined => {
  let best: Unit | undefined;
  for (const unit of candidates) {
    if (!best || unit.factor > best.factor) best = unit;
  }
  return best;
};

export const humanize = (
  base: number,
  units: readonly Unit[]
): { value: number; unit: Unit } => {
  const readable = units.filter((unit) => {
    const scaled = readableIn(base, unit);
    return scaled >= 1 && scaled < 1000;
  });
  const oversized = units.filter((unit) => readableIn(base, unit) >= 1);

  const chosen = largest(readable) ?? largest(oversized) ?? units[0]!;

  return { value: fromBase(base, chosen), unit: chosen };
};
