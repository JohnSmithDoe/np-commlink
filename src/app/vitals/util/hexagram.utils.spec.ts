import { HEXAGRAMS } from '../model/iching.consts';
import { CastLine, HexagramRecord, LineValue } from '../model/iching.types';
import {
  castLine,
  hexagramFor,
  hexagramGlyph,
  isChangingLine,
  isYangLine,
  lowerTrigramOf,
  transformedHexagramFor,
  upperTrigramOf,
} from './hexagram.utils';

const lines = (...values: LineValue[]): CastLine[] =>
  values.map((value) => ({ value, coins: [] }));

const coins = (...faces: number[]): (() => number) => {
  let index = 0;
  return () => faces[index++] ?? 0;
};

const record = (number: number, pattern: string): HexagramRecord => ({
  number,
  pattern,
  nameKey: '',
  judgementKey: '',
});

const reverse = (pattern: string) => [...pattern].toReversed().join('');

const complement = (pattern: string) =>
  [...pattern].map((bit) => (bit === '1' ? '0' : '1')).join('');

describe('the King Wen table', () => {
  it('holds all 64 six-bit patterns exactly once', () => {
    expect(new Set(HEXAGRAMS.map((entry) => entry.pattern)).size).toBe(64);
  });

  it('numbers them 1..64 in table order', () => {
    expect(HEXAGRAMS.map((entry) => entry.number)).toEqual(
      Array.from({ length: 64 }, (_unused, index) => index + 1)
    );
  });

  it('gives every hexagram its own name and judgement key', () => {
    const keys = HEXAGRAMS.flatMap((entry) => [
      entry.nameKey,
      entry.judgementKey,
    ]);

    expect(new Set(keys).size).toBe(128);
    expect(
      HEXAGRAMS.every(
        (entry) =>
          entry.judgementKey === `vitals.iching.judgement.${entry.number}`
      )
    ).toBe(true);
  });

  it('pairs each hexagram with its vertical reversal, or its complement when symmetric', () => {
    for (let index = 0; index < HEXAGRAMS.length; index += 2) {
      const first = HEXAGRAMS[index]?.pattern ?? '';
      const second = HEXAGRAMS[index + 1]?.pattern ?? '';
      const expected =
        reverse(first) === first ? complement(first) : reverse(first);

      expect(second).toBe(expected);
    }
  });
});

const ALL_VALUES: readonly LineValue[] = [6, 7, 8, 9];

describe('line values', () => {
  it('reads yang off the parity, not off a stored flag', () => {
    expect(ALL_VALUES.filter((value) => isYangLine(value))).toEqual([7, 9]);
  });

  it('marks only the old lines as changing', () => {
    expect(ALL_VALUES.filter((value) => isChangingLine(value))).toEqual([6, 9]);
  });
});

describe('castLine', () => {
  it('sums three tails to old yin', () => {
    expect(castLine(coins(0.9, 0.9, 0.9)).value).toBe(6);
  });

  it('sums three heads to old yang', () => {
    expect(castLine(coins(0.1, 0.1, 0.1)).value).toBe(9);
  });

  it('sums one head to young yang and two to young yin', () => {
    expect(castLine(coins(0.1, 0.9, 0.9)).value).toBe(7);
    expect(castLine(coins(0.1, 0.1, 0.9)).value).toBe(8);
  });

  it('keeps the three coins it threw', () => {
    expect(castLine(coins(0.1, 0.9, 0.1)).coins).toEqual([
      'heads',
      'tails',
      'heads',
    ]);
  });
});

describe('hexagramFor', () => {
  it('reads the lines bottom to top', () => {
    expect(hexagramFor(lines(7, 7, 7, 8, 8, 8))?.number).toBe(11);
    expect(hexagramFor(lines(8, 8, 8, 7, 7, 7))?.number).toBe(12);
  });

  it('names the doubled trigrams', () => {
    expect(hexagramFor(lines(7, 7, 7, 7, 7, 7))?.number).toBe(1);
    expect(hexagramFor(lines(8, 8, 8, 8, 8, 8))?.number).toBe(2);
    expect(hexagramFor(lines(8, 7, 8, 8, 7, 8))?.number).toBe(29);
  });

  it('has no answer before all six lines are cast', () => {
    expect(hexagramFor(lines(7, 7, 7))).toBeUndefined();
  });
});

describe('transformedHexagramFor', () => {
  it('flips only the changing lines', () => {
    expect(hexagramFor(lines(9, 7, 7, 8, 8, 8))?.number).toBe(11);
    expect(transformedHexagramFor(lines(9, 7, 7, 8, 8, 8))?.number).toBe(46);
  });

  it('stays silent when nothing is changing', () => {
    expect(transformedHexagramFor(lines(7, 7, 7, 8, 8, 8))).toBeUndefined();
  });

  it('turns the all-old-yang cast into its opposite', () => {
    expect(transformedHexagramFor(lines(9, 9, 9, 9, 9, 9))?.number).toBe(2);
  });
});

describe('hexagramGlyph', () => {
  it('takes the Unicode block in King Wen order', () => {
    expect(hexagramGlyph(record(1, '111111'))).toBe('䷀');
    expect(hexagramGlyph(record(64, '010101'))).toBe('䷿');
  });
});

describe('trigram halves', () => {
  it('splits the pattern into a lower and an upper trigram', () => {
    const peace = hexagramFor(lines(7, 7, 7, 8, 8, 8));

    expect(peace && lowerTrigramOf(peace)?.glyph).toBe('☰');
    expect(peace && upperTrigramOf(peace)?.glyph).toBe('☷');
  });
});
