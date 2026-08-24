/* ─── why ─────────────────────────────────────────────────────────
 * `ZODIAC_BY_SIGN` is declared in CALENDAR order, starting at Aquarius —
 * not Aries-first — and `ZODIAC_SIGNS` is its values. Ordering the record
 * rather than a second array keeps the lookup table and the ordered one
 * from disagreeing, and calendar order is what lets a season's window be
 * "up to the next entry's start", so no record carries an end date its
 * neighbour could contradict.
 *
 * `ASTRO_AGES` is 2150 years per age with Pisces at 1..2150 CE. There is no
 * consensus on those boundaries — schemes differ by centuries and some put
 * Aquarius already underway — so the page labels them an estimate rather
 * than pretending to a source. Year 0 is deliberately in no age: the era
 * labels have no year zero to print.
 * ───────────────────────────────────────────────────────────────── */

import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import {
  AstroAge,
  KiStar,
  ZodiacElement,
  ZodiacSign,
  ZodiacSignRecord,
} from './astro.types';

export const ZODIAC_ELEMENT_LABEL_KEYS: Record<ZodiacElement, Marker> = {
  fire: marker('vitals.astro.element.fire'),
  earth: marker('vitals.astro.element.earth'),
  air: marker('vitals.astro.element.air'),
  water: marker('vitals.astro.element.water'),
};

export const ZODIAC_BY_SIGN: Record<ZodiacSign, ZodiacSignRecord> = {
  aquarius: {
    sign: 'aquarius',
    glyph: '♒',
    element: 'air',
    from: { month: 1, day: 20 },
    nameKey: marker('vitals.astro.sign.aquarius'),
    traitKey: marker('vitals.astro.trait.aquarius'),
  },
  pisces: {
    sign: 'pisces',
    glyph: '♓',
    element: 'water',
    from: { month: 2, day: 19 },
    nameKey: marker('vitals.astro.sign.pisces'),
    traitKey: marker('vitals.astro.trait.pisces'),
  },
  aries: {
    sign: 'aries',
    glyph: '♈',
    element: 'fire',
    from: { month: 3, day: 21 },
    nameKey: marker('vitals.astro.sign.aries'),
    traitKey: marker('vitals.astro.trait.aries'),
  },
  taurus: {
    sign: 'taurus',
    glyph: '♉',
    element: 'earth',
    from: { month: 4, day: 20 },
    nameKey: marker('vitals.astro.sign.taurus'),
    traitKey: marker('vitals.astro.trait.taurus'),
  },
  gemini: {
    sign: 'gemini',
    glyph: '♊',
    element: 'air',
    from: { month: 5, day: 21 },
    nameKey: marker('vitals.astro.sign.gemini'),
    traitKey: marker('vitals.astro.trait.gemini'),
  },
  cancer: {
    sign: 'cancer',
    glyph: '♋',
    element: 'water',
    from: { month: 6, day: 21 },
    nameKey: marker('vitals.astro.sign.cancer'),
    traitKey: marker('vitals.astro.trait.cancer'),
  },
  leo: {
    sign: 'leo',
    glyph: '♌',
    element: 'fire',
    from: { month: 7, day: 23 },
    nameKey: marker('vitals.astro.sign.leo'),
    traitKey: marker('vitals.astro.trait.leo'),
  },
  virgo: {
    sign: 'virgo',
    glyph: '♍',
    element: 'earth',
    from: { month: 8, day: 23 },
    nameKey: marker('vitals.astro.sign.virgo'),
    traitKey: marker('vitals.astro.trait.virgo'),
  },
  libra: {
    sign: 'libra',
    glyph: '♎',
    element: 'air',
    from: { month: 9, day: 23 },
    nameKey: marker('vitals.astro.sign.libra'),
    traitKey: marker('vitals.astro.trait.libra'),
  },
  scorpio: {
    sign: 'scorpio',
    glyph: '♏',
    element: 'water',
    from: { month: 10, day: 23 },
    nameKey: marker('vitals.astro.sign.scorpio'),
    traitKey: marker('vitals.astro.trait.scorpio'),
  },
  sagittarius: {
    sign: 'sagittarius',
    glyph: '♐',
    element: 'fire',
    from: { month: 11, day: 22 },
    nameKey: marker('vitals.astro.sign.sagittarius'),
    traitKey: marker('vitals.astro.trait.sagittarius'),
  },
  capricorn: {
    sign: 'capricorn',
    glyph: '♑',
    element: 'earth',
    from: { month: 12, day: 22 },
    nameKey: marker('vitals.astro.sign.capricorn'),
    traitKey: marker('vitals.astro.trait.capricorn'),
  },
};

export const ZODIAC_SIGNS: readonly ZodiacSignRecord[] =
  Object.values(ZODIAC_BY_SIGN);

export const ASTRO_AGES: readonly AstroAge[] = [
  {
    sign: 'gemini',
    fromYear: -6450,
    toYear: -4301,
    effectKey: marker('vitals.astro.age.gemini'),
  },
  {
    sign: 'taurus',
    fromYear: -4300,
    toYear: -2151,
    effectKey: marker('vitals.astro.age.taurus'),
  },
  {
    sign: 'aries',
    fromYear: -2150,
    toYear: -1,
    effectKey: marker('vitals.astro.age.aries'),
  },
  {
    sign: 'pisces',
    fromYear: 1,
    toYear: 2150,
    effectKey: marker('vitals.astro.age.pisces'),
  },
  {
    sign: 'aquarius',
    fromYear: 2151,
    toYear: 4300,
    effectKey: marker('vitals.astro.age.aquarius'),
  },
  {
    sign: 'capricorn',
    fromYear: 4301,
    toYear: 6450,
    effectKey: marker('vitals.astro.age.capricorn'),
  },
];

export const KI_STARS: readonly KiStar[] = [
  {
    number: 1,
    trigram: '☵',
    nameKey: marker('vitals.astro.ki.name.1'),
    elementKey: marker('vitals.astro.ki.element.water'),
    personalityKey: marker('vitals.astro.ki.personality.1'),
    strengthKey: marker('vitals.astro.ki.strength.1'),
    shadowKey: marker('vitals.astro.ki.shadow.1'),
  },
  {
    number: 2,
    trigram: '☷',
    nameKey: marker('vitals.astro.ki.name.2'),
    elementKey: marker('vitals.astro.ki.element.soil'),
    personalityKey: marker('vitals.astro.ki.personality.2'),
    strengthKey: marker('vitals.astro.ki.strength.2'),
    shadowKey: marker('vitals.astro.ki.shadow.2'),
  },
  {
    number: 3,
    trigram: '☳',
    nameKey: marker('vitals.astro.ki.name.3'),
    elementKey: marker('vitals.astro.ki.element.tree'),
    personalityKey: marker('vitals.astro.ki.personality.3'),
    strengthKey: marker('vitals.astro.ki.strength.3'),
    shadowKey: marker('vitals.astro.ki.shadow.3'),
  },
  {
    number: 4,
    trigram: '☴',
    nameKey: marker('vitals.astro.ki.name.4'),
    elementKey: marker('vitals.astro.ki.element.tree'),
    personalityKey: marker('vitals.astro.ki.personality.4'),
    strengthKey: marker('vitals.astro.ki.strength.4'),
    shadowKey: marker('vitals.astro.ki.shadow.4'),
  },
  {
    number: 5,
    trigram: '☯',
    nameKey: marker('vitals.astro.ki.name.5'),
    elementKey: marker('vitals.astro.ki.element.soil'),
    personalityKey: marker('vitals.astro.ki.personality.5'),
    strengthKey: marker('vitals.astro.ki.strength.5'),
    shadowKey: marker('vitals.astro.ki.shadow.5'),
  },
  {
    number: 6,
    trigram: '☰',
    nameKey: marker('vitals.astro.ki.name.6'),
    elementKey: marker('vitals.astro.ki.element.metal'),
    personalityKey: marker('vitals.astro.ki.personality.6'),
    strengthKey: marker('vitals.astro.ki.strength.6'),
    shadowKey: marker('vitals.astro.ki.shadow.6'),
  },
  {
    number: 7,
    trigram: '☱',
    nameKey: marker('vitals.astro.ki.name.7'),
    elementKey: marker('vitals.astro.ki.element.metal'),
    personalityKey: marker('vitals.astro.ki.personality.7'),
    strengthKey: marker('vitals.astro.ki.strength.7'),
    shadowKey: marker('vitals.astro.ki.shadow.7'),
  },
  {
    number: 8,
    trigram: '☶',
    nameKey: marker('vitals.astro.ki.name.8'),
    elementKey: marker('vitals.astro.ki.element.soil'),
    personalityKey: marker('vitals.astro.ki.personality.8'),
    strengthKey: marker('vitals.astro.ki.strength.8'),
    shadowKey: marker('vitals.astro.ki.shadow.8'),
  },
  {
    number: 9,
    trigram: '☲',
    nameKey: marker('vitals.astro.ki.name.9'),
    elementKey: marker('vitals.astro.ki.element.fire'),
    personalityKey: marker('vitals.astro.ki.personality.9'),
    strengthKey: marker('vitals.astro.ki.strength.9'),
    shadowKey: marker('vitals.astro.ki.shadow.9'),
  },
];
