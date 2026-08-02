import holidays2025 from './holidays-2025-BE.json';
import holidays2026 from './holidays-2026-BE.json';
import holidays2027 from './holidays-2027-BE.json';

type PublishedHoliday = { datum: string; hinweis: string };

const PUBLISHED_BY_YEAR: Record<number, Record<string, PublishedHoliday>> = {
  2025: holidays2025,
  2026: holidays2026,
  2027: holidays2027,
};

const CANONICAL_NAME: Record<string, string> = {
  Neujahrstag: 'Neujahr',
  Frauentag: 'Internationaler Frauentag',
  '1. Weihnachtstag': '1. Weihnachtsfeiertag',
  '2. Weihnachtstag': '2. Weihnachtsfeiertag',
};

const canonical = (publishedName: string): string =>
  CANONICAL_NAME[publishedName] ?? publishedName;

export const publishedBerlinHolidays = (year: number): Record<string, string> =>
  Object.fromEntries(
    Object.entries(PUBLISHED_BY_YEAR[year]).map(([name, { datum }]) => [
      canonical(name),
      datum,
    ])
  );

export const PUBLISHED_YEARS = Object.keys(PUBLISHED_BY_YEAR).map(Number);

export const ONE_OFF_LIBERATION_DAY_2025 = '8. Mai 2025';
