/* ─── why ─────────────────────────────────────────────────────────
 * `ZODIAC_BY_SIGN` is declared in CALENDAR order, starting at Aquarius —
 * not Aries-first — and `ZODIAC_SIGNS` is its values. Ordering the record
 * rather than a second array keeps the lookup table and the ordered one
 * from disagreeing, and calendar order is what lets a season's window be
 * "up to the next entry's start", so no record carries an end date its
 * neighbour could contradict.
 *
 * `ASTRO_AGES` is 2150 years per age with Pisces at 1..2150 CE — Neil Mann's
 * equal division. There is no consensus on those boundaries, so the page
 * shows `AQUARIUS_ONSETS` beside it: what each published school answers, as
 * cited by Wikipedia's "Age of Aquarius" and "Astrological age", Jung's
 * *Aion* fn. 84, and Bradley for Fagan–Bradley, checked 2026-10-17. Year 0
 * is deliberately in no age: the era labels have no year zero to print.
 * ───────────────────────────────────────────────────────────────── */

import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Marker } from '../../@shared/model/app.types';
import {
  AquariusOnset,
  AstroAge,
  ChineseAnimal,
  ChineseElement,
  ChinesePolarity,
  ChineseSignRecord,
  KiStar,
  ZodiacElement,
  ZodiacSign,
  ZodiacSignRecord,
} from './astro.types';

const TEXT_PRESENTATION = '\u{FE0E}';

export const asText = (symbol: string): string =>
  `${symbol}${TEXT_PRESENTATION}`;

export const ZODIAC_ELEMENT_LABEL_KEYS: Record<ZodiacElement, Marker> = {
  fire: marker('vitals.astro.element.fire'),
  earth: marker('vitals.astro.element.earth'),
  air: marker('vitals.astro.element.air'),
  water: marker('vitals.astro.element.water'),
};

export const ZODIAC_BY_SIGN: Record<ZodiacSign, ZodiacSignRecord> = {
  aquarius: {
    sign: 'aquarius',
    glyph: asText('♒'),
    element: 'air',
    from: { month: 1, day: 20 },
    nameKey: marker('vitals.astro.sign.aquarius'),
    traitKey: marker('vitals.astro.trait.aquarius'),
  },
  pisces: {
    sign: 'pisces',
    glyph: asText('♓'),
    element: 'water',
    from: { month: 2, day: 19 },
    nameKey: marker('vitals.astro.sign.pisces'),
    traitKey: marker('vitals.astro.trait.pisces'),
  },
  aries: {
    sign: 'aries',
    glyph: asText('♈'),
    element: 'fire',
    from: { month: 3, day: 21 },
    nameKey: marker('vitals.astro.sign.aries'),
    traitKey: marker('vitals.astro.trait.aries'),
  },
  taurus: {
    sign: 'taurus',
    glyph: asText('♉'),
    element: 'earth',
    from: { month: 4, day: 20 },
    nameKey: marker('vitals.astro.sign.taurus'),
    traitKey: marker('vitals.astro.trait.taurus'),
  },
  gemini: {
    sign: 'gemini',
    glyph: asText('♊'),
    element: 'air',
    from: { month: 5, day: 21 },
    nameKey: marker('vitals.astro.sign.gemini'),
    traitKey: marker('vitals.astro.trait.gemini'),
  },
  cancer: {
    sign: 'cancer',
    glyph: asText('♋'),
    element: 'water',
    from: { month: 6, day: 21 },
    nameKey: marker('vitals.astro.sign.cancer'),
    traitKey: marker('vitals.astro.trait.cancer'),
  },
  leo: {
    sign: 'leo',
    glyph: asText('♌'),
    element: 'fire',
    from: { month: 7, day: 23 },
    nameKey: marker('vitals.astro.sign.leo'),
    traitKey: marker('vitals.astro.trait.leo'),
  },
  virgo: {
    sign: 'virgo',
    glyph: asText('♍'),
    element: 'earth',
    from: { month: 8, day: 23 },
    nameKey: marker('vitals.astro.sign.virgo'),
    traitKey: marker('vitals.astro.trait.virgo'),
  },
  libra: {
    sign: 'libra',
    glyph: asText('♎'),
    element: 'air',
    from: { month: 9, day: 23 },
    nameKey: marker('vitals.astro.sign.libra'),
    traitKey: marker('vitals.astro.trait.libra'),
  },
  scorpio: {
    sign: 'scorpio',
    glyph: asText('♏'),
    element: 'water',
    from: { month: 10, day: 23 },
    nameKey: marker('vitals.astro.sign.scorpio'),
    traitKey: marker('vitals.astro.trait.scorpio'),
  },
  sagittarius: {
    sign: 'sagittarius',
    glyph: asText('♐'),
    element: 'fire',
    from: { month: 11, day: 22 },
    nameKey: marker('vitals.astro.sign.sagittarius'),
    traitKey: marker('vitals.astro.trait.sagittarius'),
  },
  capricorn: {
    sign: 'capricorn',
    glyph: asText('♑'),
    element: 'earth',
    from: { month: 12, day: 22 },
    nameKey: marker('vitals.astro.sign.capricorn'),
    traitKey: marker('vitals.astro.trait.capricorn'),
  },
};

export const ZODIAC_SIGNS: readonly ZodiacSignRecord[] =
  Object.values(ZODIAC_BY_SIGN);

export const CHINESE_ELEMENT_LABEL_KEYS: Record<ChineseElement, Marker> = {
  wood: marker('vitals.chinese.element.wood'),
  fire: marker('vitals.chinese.element.fire'),
  earth: marker('vitals.chinese.element.earth'),
  metal: marker('vitals.chinese.element.metal'),
  water: marker('vitals.chinese.element.water'),
};

export const CHINESE_POLARITY_LABEL_KEYS: Record<ChinesePolarity, Marker> = {
  yang: marker('vitals.chinese.polarity.yang'),
  yin: marker('vitals.chinese.polarity.yin'),
};

const CHINESE_BY_ANIMAL: Record<ChineseAnimal, ChineseSignRecord> = {
  rat: {
    animal: 'rat',
    glyph: '鼠',
    nameKey: marker('vitals.chinese.animal.rat'),
    traitKey: marker('vitals.chinese.trait.rat'),
  },
  ox: {
    animal: 'ox',
    glyph: '牛',
    nameKey: marker('vitals.chinese.animal.ox'),
    traitKey: marker('vitals.chinese.trait.ox'),
  },
  tiger: {
    animal: 'tiger',
    glyph: '虎',
    nameKey: marker('vitals.chinese.animal.tiger'),
    traitKey: marker('vitals.chinese.trait.tiger'),
  },
  rabbit: {
    animal: 'rabbit',
    glyph: '兔',
    nameKey: marker('vitals.chinese.animal.rabbit'),
    traitKey: marker('vitals.chinese.trait.rabbit'),
  },
  dragon: {
    animal: 'dragon',
    glyph: '龍',
    nameKey: marker('vitals.chinese.animal.dragon'),
    traitKey: marker('vitals.chinese.trait.dragon'),
  },
  snake: {
    animal: 'snake',
    glyph: '蛇',
    nameKey: marker('vitals.chinese.animal.snake'),
    traitKey: marker('vitals.chinese.trait.snake'),
  },
  horse: {
    animal: 'horse',
    glyph: '馬',
    nameKey: marker('vitals.chinese.animal.horse'),
    traitKey: marker('vitals.chinese.trait.horse'),
  },
  goat: {
    animal: 'goat',
    glyph: '羊',
    nameKey: marker('vitals.chinese.animal.goat'),
    traitKey: marker('vitals.chinese.trait.goat'),
  },
  monkey: {
    animal: 'monkey',
    glyph: '猴',
    nameKey: marker('vitals.chinese.animal.monkey'),
    traitKey: marker('vitals.chinese.trait.monkey'),
  },
  rooster: {
    animal: 'rooster',
    glyph: '雞',
    nameKey: marker('vitals.chinese.animal.rooster'),
    traitKey: marker('vitals.chinese.trait.rooster'),
  },
  dog: {
    animal: 'dog',
    glyph: '狗',
    nameKey: marker('vitals.chinese.animal.dog'),
    traitKey: marker('vitals.chinese.trait.dog'),
  },
  pig: {
    animal: 'pig',
    glyph: '豬',
    nameKey: marker('vitals.chinese.animal.pig'),
    traitKey: marker('vitals.chinese.trait.pig'),
  },
};

export const CHINESE_SIGNS: readonly ChineseSignRecord[] =
  Object.values(CHINESE_BY_ANIMAL);

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

export const AQUARIUS_ONSETS: readonly AquariusOnset[] = [
  {
    source: 'Samael Aun Weor',
    years: [1962],
    methodKey: marker('vitals.zodiac.onset.alignment'),
  },
  {
    source: 'C. G. Jung',
    years: [1997, 2154],
    methodKey: marker('vitals.zodiac.onset.jung'),
  },
  {
    source: 'Dane Rudhyar',
    years: [2062],
    methodKey: marker('vitals.zodiac.onset.equal-signs'),
  },
  {
    source: 'Neil Mann',
    years: [2150],
    usedHere: true,
    methodKey: marker('vitals.zodiac.onset.equal-signs'),
  },
  {
    source: 'Fagan & Bradley',
    years: [2376],
    methodKey: marker('vitals.zodiac.onset.sidereal'),
  },
  {
    source: 'Hermann Haupt',
    years: [2595],
    approximate: true,
    methodKey: marker('vitals.zodiac.onset.iau'),
  },
  {
    source: 'Max Heindel',
    years: [2654],
    approximate: true,
    methodKey: marker('vitals.zodiac.onset.heindel'),
  },
  {
    source: 'Rudolf Steiner',
    years: [3573],
    methodKey: marker('vitals.zodiac.onset.steiner'),
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
