/* ─── why ─────────────────────────────────────────────────────────
 * The Chinese year turns at the lunar new year — anywhere from 21 January
 * to 20 February — not on the Ki page's fixed 4 February. Both are real
 * conventions; this one is what every popular source prints, so a birthday
 * in late January can carry the previous animal here and not on the Ki page.
 *
 * The lunar year is asked of ICU's Chinese calendar rather than a table of
 * new-year dates: a typed table is a row that can be wrong, the calendar
 * ships in every engine this app runs on. Animal, element and polarity are
 * then plain arithmetic over that year.
 *
 * ICU misses a new moon that falls minutes from Beijing midnight. Checked
 * 1900–2100 against Meeus' new-moon series, three years disagree, and in
 * each the published date sides with Meeus: those three are overridden.
 * ───────────────────────────────────────────────────────────────── */

import dayjs from 'dayjs';
import { isoDay } from '../../@shared/util/formatting/date-format.utils';
import { CHINESE_SIGNS } from '../model/astro.consts';
import {
  ChineseAnimal,
  ChineseElement,
  ChinesePolarity,
  ChineseSignRecord,
} from '../model/astro.types';
import { ISODate } from '../model/vitals.types';
import { SeasonPhase } from './zodiac.utils';

interface ChineseYear {
  year: number;
  sign: ChineseSignRecord;
  element: ChineseElement;
  polarity: ChinesePolarity;
  fromISO: ISODate;
  toISO: ISODate;
}

export type ChineseYearPhase = ChineseYear & { phase: SeasonPhase };

const CHINESE_ELEMENTS: readonly ChineseElement[] = [
  'wood',
  'fire',
  'earth',
  'metal',
  'water',
];
const SEXAGENARY_START = 1984;
const NEW_YEAR_WINDOW_START = '-01-21';
const NEW_YEAR_WINDOW_DAYS = 32;

const NEW_YEAR_CORRECTIONS: ReadonlyMap<number, ISODate> = new Map([
  [1954, '1954-02-03'],
  [2027, '2027-02-06'],
  [2030, '2030-02-03'],
]);

const lunarCalendar = new Intl.DateTimeFormat('en-u-ca-chinese', {
  year: 'numeric',
  timeZone: 'UTC',
});

const modulo = (value: number, divisor: number): number =>
  ((value % divisor) + divisor) % divisor;

const icuLunarYearOf = (date: dayjs.Dayjs): number | undefined => {
  const related = lunarCalendar
    .formatToParts(new Date(`${isoDay(date)}T12:00:00Z`))
    .find((part: { type: string }) => part.type === 'relatedYear')?.value;
  return related === undefined ? undefined : Number(related);
};

const lunarYearOf = (date: dayjs.Dayjs): number | undefined => {
  const year = icuLunarYearOf(date);
  if (year === undefined) return undefined;

  const day = isoDay(date);
  const opening = NEW_YEAR_CORRECTIONS.get(year);
  const following = NEW_YEAR_CORRECTIONS.get(year + 1);
  if (opening && day < opening) return year - 1;
  if (following && day >= following) return year + 1;
  return year;
};

export const chineseYearFor = (iso: ISODate): number | undefined => {
  const date = dayjs(iso);
  return date.isValid() ? lunarYearOf(date) : undefined;
};

const chineseSignOfYear = (year: number): ChineseSignRecord =>
  CHINESE_SIGNS[modulo(year - 4, 12)]!;

export const chineseElementOfYear = (year: number): ChineseElement =>
  CHINESE_ELEMENTS[Math.floor(modulo(year - 4, 10) / 2)]!;

const chinesePolarityOfYear = (year: number): ChinesePolarity =>
  modulo(year - 4, 2) === 0 ? 'yang' : 'yin';

export const chineseSignFor = (iso: ISODate): ChineseSignRecord | undefined => {
  const year = chineseYearFor(iso);
  return year === undefined ? undefined : chineseSignOfYear(year);
};

export const lunarNewYear = (year: number): ISODate => {
  const corrected = NEW_YEAR_CORRECTIONS.get(year);
  if (corrected) return corrected;

  const windowStart = dayjs(`${year}${NEW_YEAR_WINDOW_START}`);
  let low = 0;
  let high = NEW_YEAR_WINDOW_DAYS;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (icuLunarYearOf(windowStart.add(middle, 'day')) === year) high = middle;
    else low = middle + 1;
  }
  return isoDay(windowStart.add(low, 'day'));
};

export const chineseYearWindow = (year: number): ChineseYear => ({
  year,
  sign: chineseSignOfYear(year),
  element: chineseElementOfYear(year),
  polarity: chinesePolarityOfYear(year),
  fromISO: lunarNewYear(year),
  toISO: isoDay(dayjs(lunarNewYear(year + 1)).subtract(1, 'day')),
});

const PHASE_OFFSETS: readonly [SeasonPhase, number][] = [
  ['previous', -1],
  ['current', 0],
  ['next', 1],
];

export const chineseTimelineAround = (
  iso: ISODate
): readonly ChineseYearPhase[] => {
  const year = chineseYearFor(iso);
  if (year === undefined) return [];

  return PHASE_OFFSETS.map(([phase, offset]) => ({
    ...chineseYearWindow(year + offset),
    phase,
  }));
};

export const chineseCycleAround = (iso: ISODate): readonly ChineseYear[] => {
  const year = chineseYearFor(iso);
  if (year === undefined) return [];

  const ratYear = year - modulo(year - 4, 12);
  return CHINESE_SIGNS.map((_, index) => chineseYearWindow(ratYear + index));
};

export const sexagenaryYearsOf = (
  animal: ChineseAnimal,
  iso: ISODate
): readonly number[] => {
  const year = chineseYearFor(iso);
  if (year === undefined) return [];

  const cycleStart = year - modulo(year - SEXAGENARY_START, 60);
  const firstYear =
    cycleStart + CHINESE_SIGNS.findIndex((record) => record.animal === animal);
  return CHINESE_ELEMENTS.map((_, index) => firstYear + index * 12);
};
