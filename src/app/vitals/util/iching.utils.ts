/* ─── why ─────────────────────────────────────────────────────────
 * The Ki year turns on 4 February, not 1 January, so a birthday in the
 * first five weeks of a year carries the PREVIOUS year's star. That is the
 * whole reason these pages take a date rather than a year.
 *
 * The number descends by one per year and wraps 1 → 9, which the classic
 * rule spells as "11 minus the digit sum". Digit sums are congruent mod 9,
 * so one modulo over a fixed anchor year says the same thing without a
 * per-century variant of the rule — and the anchor lands directly on the
 * table index, so nothing has to defend a 1-based number twice.
 *
 * The life number is the OTHER digit sum: the whole date, not the year, and
 * reduced rather than subtracted. It answers to numerology, not to the Ki
 * cycle, so it is a second reading beside the star and never folded into
 * it — the same date gives 1980 → Ki 2 and 1980-08-05 → life 4.
 * ───────────────────────────────────────────────────────────────── */

import dayjs from 'dayjs';
import { KI_STARS } from '../model/astro.consts';
import { KiStar } from '../model/astro.types';
import { LIFE_NUMBERS } from '../model/iching.consts';
import { LifeNumberRecord } from '../model/iching.types';
import { ISODate } from '../model/vitals.types';

const KI_ANCHOR_YEAR = 2027;
const KI_YEAR_START = '-02-04';

export const kiYearFor = (iso: ISODate): number | undefined => {
  const date = dayjs(iso);
  if (!date.isValid()) return undefined;

  const year = date.year();
  return date.isBefore(dayjs(`${year}${KI_YEAR_START}`)) ? year - 1 : year;
};

export const kiStarFor = (iso: ISODate): KiStar | undefined => {
  const year = kiYearFor(iso);
  if (year === undefined) return undefined;

  return KI_STARS[(((KI_ANCHOR_YEAR - year) % 9) + 8) % 9];
};

const digitSum = (digits: string): number => {
  let sum = 0;
  for (const digit of digits) sum += Number(digit);
  return sum;
};

export const birthDigitSumFor = (iso: ISODate): number | undefined => {
  const date = dayjs(iso);
  return date.isValid() ? digitSum(date.format('YYYYMMDD')) : undefined;
};

export const lifeNumberFor = (iso: ISODate): LifeNumberRecord | undefined => {
  const sum = birthDigitSumFor(iso);
  if (sum === undefined) return undefined;

  let reduced = sum;
  while (reduced > 9) reduced = digitSum(String(reduced));
  return LIFE_NUMBERS[reduced - 1];
};
