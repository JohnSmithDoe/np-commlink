import { ZODIAC_SIGNS } from '../model/astro.consts';
import { HEXAGRAMS } from '../model/iching.consts';
import {
  astroAgeOfSign,
  hexagramNeighbours,
  hexagramNumbered,
  zodiacNeighbours,
  zodiacSignNamed,
} from './browse.utils';

describe('zodiacSignNamed', () => {
  it('finds a sign by its own name', () => {
    expect(zodiacSignNamed('scorpio')?.glyph).toBe('♏');
  });

  it('answers undefined for anything else', () => {
    expect(zodiacSignNamed('ophiuchus')).toBeUndefined();
    expect(zodiacSignNamed('')).toBeUndefined();
  });
});

describe('hexagramNumbered', () => {
  it('reads the number off the route parameter', () => {
    expect(hexagramNumbered('31')?.pattern).toBe('001110');
  });

  it('refuses a number outside the sixty-four, and a padded one', () => {
    expect(hexagramNumbered('0')).toBeUndefined();
    expect(hexagramNumbered('65')).toBeUndefined();
    expect(hexagramNumbered('05')).toBeUndefined();
    expect(hexagramNumbered('sechs')).toBeUndefined();
  });
});

describe('neighbours', () => {
  it('wraps the zodiac at both ends', () => {
    const first = ZODIAC_SIGNS[0]!;
    const last = ZODIAC_SIGNS.at(-1)!;

    expect(zodiacNeighbours(first)?.previous).toBe(last);
    expect(zodiacNeighbours(last)?.next).toBe(first);
  });

  it('wraps the hexagrams at both ends', () => {
    expect(hexagramNeighbours(HEXAGRAMS[0]!)?.previous.number).toBe(64);
    expect(hexagramNeighbours(HEXAGRAMS.at(-1)!)?.next.number).toBe(1);
  });

  it('steps one apart in the middle', () => {
    const steps = hexagramNeighbours(HEXAGRAMS[30]!);

    expect(steps?.previous.number).toBe(30);
    expect(steps?.next.number).toBe(32);
  });
});

describe('astroAgeOfSign', () => {
  it('names the age a sign rules, where it rules one', () => {
    expect(astroAgeOfSign('pisces')?.fromYear).toBe(1);
  });

  it('answers undefined for the six signs no age is named for', () => {
    expect(astroAgeOfSign('scorpio')).toBeUndefined();
  });
});
