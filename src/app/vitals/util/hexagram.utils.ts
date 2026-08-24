/* ─── why ─────────────────────────────────────────────────────────
 * Three coins per line, heads 3 and tails 2, so the sum is 6..9 and the
 * PARITY carries the line while 6 and 9 additionally mark it as changing.
 * That is one number holding two facts, which is why `isYangLine` and
 * `isChangingLine` are separate predicates over the same value rather than
 * two stored fields that could disagree.
 *
 * A pattern is the six lines read BOTTOM to top — the order they are cast
 * in, and the order `HEXAGRAMS` is indexed by. The transformed hexagram is
 * the same walk with `afterChange` in place of `isYangLine`, so the two
 * readings cannot diverge on how a line becomes a bit.
 *
 * `random` is a parameter, like `ritual.draw.ts` — a spec pins the coins
 * instead of throwing until it sees what it needs.
 * ───────────────────────────────────────────────────────────────── */

import { HEXAGRAMS, TRIGRAMS } from '../model/iching.consts';
import {
  CastLine,
  CoinFace,
  HexagramRecord,
  LineValue,
  TrigramRecord,
} from '../model/iching.types';

export const HEXAGRAM_LINES = 6;
const COINS_PER_THROW = 3;
const TRIGRAM_LINES = 3;
const HEXAGRAM_CODE_POINT = 0x4d_c0;

export const isYangLine = (value: LineValue): boolean => value % 2 === 1;

export const isChangingLine = (value: LineValue): boolean =>
  value === 6 || value === 9;

const afterChange = (value: LineValue): boolean =>
  isChangingLine(value) ? !isYangLine(value) : isYangLine(value);

const lineValueFor = (heads: number): LineValue => {
  switch (heads) {
    case 0: {
      return 6;
    }
    case 1: {
      return 7;
    }
    case 2: {
      return 8;
    }
    default: {
      return 9;
    }
  }
};

export const castLine = (random: () => number = Math.random): CastLine => {
  const coins: readonly CoinFace[] = Array.from(
    { length: COINS_PER_THROW },
    (): CoinFace => (random() < 0.5 ? 'heads' : 'tails')
  );
  const heads = coins.filter((coin) => coin === 'heads').length;
  return { value: lineValueFor(heads), coins };
};

const patternOf = (
  lines: readonly CastLine[],
  yangOf: (value: LineValue) => boolean
): string => lines.map((line) => (yangOf(line.value) ? '1' : '0')).join('');

const hexagramOf = (pattern: string): HexagramRecord | undefined =>
  HEXAGRAMS.find((hexagram) => hexagram.pattern === pattern);

export const hexagramFor = (
  lines: readonly CastLine[]
): HexagramRecord | undefined =>
  lines.length === HEXAGRAM_LINES
    ? hexagramOf(patternOf(lines, isYangLine))
    : undefined;

export const transformedHexagramFor = (
  lines: readonly CastLine[]
): HexagramRecord | undefined =>
  lines.length === HEXAGRAM_LINES &&
  lines.some((line) => isChangingLine(line.value))
    ? hexagramOf(patternOf(lines, afterChange))
    : undefined;

export const hexagramGlyph = (hexagram: HexagramRecord): string =>
  String.fromCodePoint(HEXAGRAM_CODE_POINT + hexagram.number - 1);

const trigramOf = (pattern: string): TrigramRecord | undefined =>
  TRIGRAMS.find((trigram) => trigram.pattern === pattern);

export const lowerTrigramOf = (
  hexagram: HexagramRecord
): TrigramRecord | undefined =>
  trigramOf(hexagram.pattern.slice(0, TRIGRAM_LINES));

export const upperTrigramOf = (
  hexagram: HexagramRecord
): TrigramRecord | undefined =>
  trigramOf(hexagram.pattern.slice(TRIGRAM_LINES));
