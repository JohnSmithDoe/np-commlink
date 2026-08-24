/* ─── why ─────────────────────────────────────────────────────────
 * A season is derived from START dates alone — one sign's window ends the
 * day before the next one's begins — so no table entry can disagree with
 * its neighbour about where the boundary is.
 *
 * The starts are laid out over THREE years, not one. Capricorn opens in
 * December and closes in January, so a date in the first three weeks of
 * January belongs to the previous year's season and the "previous" slot of
 * a date in late December belongs to that year's Sagittarius. Spanning
 * year-1..year+1 turns both wraps into ordinary neighbours in one sorted
 * list, and the phase triple is then just three adjacent indexes.
 *
 * Every entry point answers `undefined`/`[]` for an unparseable date: the
 * pages take a free-text date the reader can clear mid-edit.
 * ───────────────────────────────────────────────────────────────── */

import dayjs from 'dayjs';
import { isoDay } from '../../@shared/util/formatting/date-format.utils';
import { ASTRO_AGES, ZODIAC_SIGNS } from '../model/astro.consts';
import { AstroAge, MonthDay, ZodiacSignRecord } from '../model/astro.types';
import { ISODate } from '../model/vitals.types';

export type SeasonPhase = 'previous' | 'current' | 'next';

export interface ZodiacSeason {
  sign: ZodiacSignRecord;
  fromISO: ISODate;
  toISO: ISODate;
  phase: SeasonPhase;
}

interface SeasonStart {
  sign: ZodiacSignRecord;
  startISO: ISODate;
}

const SEASON_PHASES: readonly SeasonPhase[] = ['previous', 'current', 'next'];
const ANCHOR_OFFSETS: readonly number[] = [-1, 0, 1];

const startISO = (year: number, { month, day }: MonthDay): ISODate =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const dayBefore = (iso: ISODate): ISODate =>
  isoDay(dayjs(iso).subtract(1, 'day'));

const seasonStarts = (anchorYear: number): readonly SeasonStart[] =>
  ANCHOR_OFFSETS.flatMap((offset) =>
    ZODIAC_SIGNS.map((sign) => ({
      sign,
      startISO: startISO(anchorYear + offset, sign.from),
    }))
  );

export const zodiacTimelineAround = (iso: ISODate): readonly ZodiacSeason[] => {
  const date = dayjs(iso);
  if (!date.isValid()) return [];

  const day = isoDay(date);
  const starts = seasonStarts(date.year());
  const currentIndex = starts.findLastIndex((start) => start.startISO <= day);

  return SEASON_PHASES.flatMap((phase, offset) => {
    const season = starts[currentIndex - 1 + offset];
    const following = starts[currentIndex + offset];
    return season && following
      ? [
          {
            sign: season.sign,
            fromISO: season.startISO,
            toISO: dayBefore(following.startISO),
            phase,
          },
        ]
      : [];
  });
};

export const zodiacSignFor = (iso: ISODate): ZodiacSignRecord | undefined =>
  zodiacTimelineAround(iso).find((season) => season.phase === 'current')?.sign;

export const astroAgeFor = (iso: ISODate): AstroAge | undefined => {
  const date = dayjs(iso);
  if (!date.isValid()) return undefined;

  const year = date.year();
  return ASTRO_AGES.find((age) => year >= age.fromYear && year <= age.toYear);
};
