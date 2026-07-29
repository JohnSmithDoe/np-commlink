import holidays2025 from './holidays-2025-BE.json';
import holidays2026 from './holidays-2026-BE.json';
import holidays2027 from './holidays-2027-BE.json';

type TPublishedHoliday = { datum: string; hinweis: string };

const PUBLISHED_BY_YEAR: Record<number, Record<string, TPublishedHoliday>> = {
  2025: holidays2025,
  2026: holidays2026,
  2027: holidays2027,
};

/**
 * The published source spells three holidays differently from the names the
 * holidays card renders. The card's names are canonical — they are on screen,
 * and `Internationaler Frauentag` is the full legal name of the Berlin one —
 * so the fixture translates the source rather than the util.
 */
const CANONICAL_NAME: Record<string, string> = {
  Neujahrstag: 'Neujahr',
  Frauentag: 'Internationaler Frauentag',
  '1. Weihnachtstag': '1. Weihnachtsfeiertag',
  '2. Weihnachtstag': '2. Weihnachtsfeiertag',
};

const canonical = (publishedName: string): string =>
  CANONICAL_NAME[publishedName] ?? publishedName;

/**
 * Berlin's holidays for a year as *published* (berlin.de), keyed by the card's
 * canonical name and valued as `YYYY-MM-DD` — real-data ground truth, so a spec
 * can pin `berlinHolidaysFor` against an authority instead of re-deriving its
 * own Easter arithmetic.
 *
 * One-off commemorative days keep their published name (`8. Mai 2025`), because
 * they have no counterpart in the util and their absence is what a spec asserts.
 */
export const publishedBerlinHolidays = (year: number): Record<string, string> =>
  Object.fromEntries(
    Object.entries(PUBLISHED_BY_YEAR[year]).map(([name, { datum }]) => [
      canonical(name),
      datum,
    ])
  );

export const PUBLISHED_YEARS = Object.keys(PUBLISHED_BY_YEAR).map(Number);

export const ONE_OFF_LIBERATION_DAY_2025 = '8. Mai 2025';
