/* ─── why ─────────────────────────────────────────────────────────
 * A route parameter is a string from outside the app, so every lookup here
 * takes one and answers `undefined` rather than asserting: a hexagram at
 * `/browse/iching/99` is a page saying so, never a crash.
 *
 * Both catalogs are CYCLES — the twelfth sign's neighbour is the first, the
 * sixty-fourth hexagram's is number one — so stepping through either can
 * never dead-end, and neither page needs a disabled edge case.
 * ───────────────────────────────────────────────────────────────── */

import { ASTRO_AGES, ZODIAC_SIGNS } from '../model/astro.consts';
import { AstroAge, ZodiacSign, ZodiacSignRecord } from '../model/astro.types';
import { HEXAGRAMS } from '../model/iching.consts';
import { HexagramRecord } from '../model/iching.types';

interface Neighbours<T> {
  previous: T;
  next: T;
}

const cycle = <T>(
  list: readonly T[],
  index: number
): Neighbours<T> | undefined => {
  const previous = list.at((index - 1) % list.length);
  const next = list.at((index + 1) % list.length);
  return previous && next ? { previous, next } : undefined;
};

export const zodiacSignNamed = (name: string): ZodiacSignRecord | undefined =>
  ZODIAC_SIGNS.find((record) => record.sign === name);

export const zodiacNeighbours = (
  record: ZodiacSignRecord
): Neighbours<ZodiacSignRecord> | undefined =>
  cycle(ZODIAC_SIGNS, ZODIAC_SIGNS.indexOf(record));

export const hexagramNumbered = (value: string): HexagramRecord | undefined =>
  HEXAGRAMS.find((record) => String(record.number) === value);

export const hexagramNeighbours = (
  record: HexagramRecord
): Neighbours<HexagramRecord> | undefined =>
  cycle(HEXAGRAMS, HEXAGRAMS.indexOf(record));

export const astroAgeOfSign = (sign: ZodiacSign): AstroAge | undefined =>
  ASTRO_AGES.find((age) => age.sign === sign);
