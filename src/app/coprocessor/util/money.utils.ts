/* ─── why ─────────────────────────────────────────────────────────
 * A suffix is resolved against the ACTIVE language, never one global table:
 * English `b` is 10^9 while German `Bio` is 10^12, and a single table would
 * be silently wrong by a factor of a thousand — the same failure that kept
 * live currency out of this module.
 *
 * pickAnchor prefers a multiple at or just below 1 over a smaller anchor with
 * a larger multiple, then takes the LARGEST qualifying rung. That is what
 * makes 320.000 km read "8x der Erdumfang" rather than "0,83x zum Mond",
 * while 2,33 Mio km still reads "6,1x zum Mond" rather than "58x der
 * Erdumfang".
 * ───────────────────────────────────────────────────────────────── */
import { Language } from '../../@shared/model/app.types';
import { MONEY_ANCHORS } from '../model/money.anchors';
import { MONEY_LADDERS, MONEY_REFERENCES } from '../model/money.catalog';
import { MAGNITUDE_VALUE } from '../model/magnitude.consts';
import {
  AnchorFamily,
  MagnitudeId,
  MoneyAnchor,
  MoneyReference,
} from '../model/money.types';
import { Unit } from '../model/units.types';
import { humanize } from './convert.utils';

const BAND_LOW = 0.9;
const BAND_HIGH = 100;
const FALLBACK_LOW = 0.5;

const SUFFIXES: Record<Language, Record<string, MagnitudeId>> = {
  de: {
    tsd: 'thousand',
    k: 'thousand',
    mio: 'million',
    mrd: 'billion',
    bio: 'trillion',
  },
  en: { k: 'thousand', m: 'million', b: 'billion', t: 'trillion' },
  fr: { k: 'thousand', m: 'million', md: 'billion', bn: 'trillion' },
};

const SEPARATORS: Record<Language, { group: RegExp; decimal: string }> = {
  de: { group: /[.\s]/g, decimal: ',' },
  en: { group: /[,\s]/g, decimal: '.' },
  fr: { group: /[.\s ]/g, decimal: ',' },
};

export const splitMagnitude = (
  raw: string,
  language: Language
): { mantissa: number; magnitude: MagnitudeId | null } | null => {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  const match = /^(-?[\d.,\s ]+?)\s*([a-z]*)$/.exec(trimmed);
  if (!match) return null;

  const [, digits = '', suffix = ''] = match;
  const { group, decimal } = SEPARATORS[language];
  const normalised = digits.replaceAll(group, '').replace(decimal, '.');
  const value = Number(normalised);
  if (normalised === '' || !Number.isFinite(value)) return null;

  if (!suffix) return { mantissa: value, magnitude: null };

  const magnitude = SUFFIXES[language][suffix];
  return magnitude ? { mantissa: value, magnitude } : null;
};

export const parseMagnitude = (
  raw: string,
  language: Language
): number | null => {
  const split = splitMagnitude(raw, language);
  if (!split) return null;
  return split.magnitude
    ? split.mantissa * MAGNITUDE_VALUE[split.magnitude]
    : split.mantissa;
};

const magnitudeOf = (value: number): MagnitudeId => {
  const size = Math.abs(value);
  if (size >= MAGNITUDE_VALUE.trillion) return 'trillion';
  if (size >= MAGNITUDE_VALUE.billion) return 'billion';
  if (size >= MAGNITUDE_VALUE.million) return 'million';
  if (size >= MAGNITUDE_VALUE.thousand) return 'thousand';
  return 'one';
};

export const spellAmount = (
  value: number
): { amount: number; magnitude: MagnitudeId; plural: boolean } => {
  const magnitude = magnitudeOf(value);
  const amount = value / MAGNITUDE_VALUE[magnitude];
  return { amount, magnitude, plural: amount !== 1 };
};

export const pickAnchor = (
  base: number,
  family: AnchorFamily
): { anchor: MoneyAnchor; multiple: number } | undefined => {
  const rungs = MONEY_ANCHORS.filter((rung) => rung.family === family);
  const inBand = rungs.filter((rung) => {
    const multiple = base / rung.value;
    return multiple >= BAND_LOW && multiple < BAND_HIGH;
  });
  const usable =
    inBand.length > 0
      ? inBand
      : rungs.filter((rung) => base / rung.value >= FALLBACK_LOW);

  let anchor: MoneyAnchor | undefined;
  for (const rung of usable) {
    if (!anchor || rung.value > anchor.value) anchor = rung;
  }

  return anchor ? { anchor, multiple: base / anchor.value } : undefined;
};

export type MoneyRow = {
  reference: MoneyReference;
  count: number;
  value: number;
  unit?: Unit;
  anchor?: { anchor: MoneyAnchor; multiple: number };
};

const rowFor = (amount: number, reference: MoneyReference): MoneyRow => {
  const count = amount / reference.rate;

  if (!reference.derive) {
    return {
      reference,
      count,
      value: count,
      anchor: reference.family
        ? pickAnchor(count, reference.family)
        : undefined,
    };
  }

  const base = count * reference.derive.factor;
  const { value, unit } = humanize(base, MONEY_LADDERS[reference.derive.unit]);

  return {
    reference,
    count,
    value,
    unit,
    anchor: pickAnchor(base, reference.derive.unit),
  };
};

export const referenceResults = (amount: number): MoneyRow[] =>
  MONEY_REFERENCES.map((reference) => rowFor(amount, reference));
