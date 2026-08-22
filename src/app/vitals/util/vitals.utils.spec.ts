import { mockReading } from '../testing/vitals.test-data';
import {
  nearestReadingUpTo,
  readingOn,
  readingsOf,
  summaryFor,
} from './vitals.utils';

const readings = [
  mockReading({ id: 'a', name: '2026-08-01', grams: 78_000 }),
  mockReading({ id: 'b', name: '2026-08-10', grams: 77_500 }),
  mockReading({ id: 'c', name: '2026-08-20', grams: 77_800 }),
  mockReading({ id: 'd', name: '2026-08-20', grams: 4300, profileId: 'cat' }),
];

describe('readingsOf', () => {
  it('keeps one profile out of a flat list', () => {
    expect(readingsOf(readings, 'cat').map(({ id }) => id)).toEqual(['d']);
  });
});

describe('readingOn', () => {
  it('finds one profile’s reading for a date, not a twin from another', () => {
    expect(readingOn(readings, 'profile-1', '2026-08-20')?.id).toBe('c');
  });

  it('answers nothing for an unweighed day', () => {
    expect(readingOn(readings, 'profile-1', '2026-08-21')).toBeUndefined();
  });
});

describe('nearestReadingUpTo', () => {
  it('takes the latest reading at or before the date', () => {
    expect(nearestReadingUpTo(readings, 'profile-1', '2026-08-15')?.id).toBe(
      'b'
    );
  });

  it('never reaches forward past the date', () => {
    expect(
      nearestReadingUpTo(readings, 'profile-1', '2026-07-01')
    ).toBeUndefined();
  });
});

describe('summaryFor', () => {
  it('reports the latest weight and the step from the one before', () => {
    expect(summaryFor(readingsOf(readings, 'profile-1'))).toEqual({
      count: 3,
      latestGrams: 77_800,
      deltaGrams: 300,
    });
  });

  it('offers no delta for a single reading', () => {
    expect(summaryFor([readings[1]!])).toEqual({
      count: 1,
      latestGrams: 77_500,
      deltaGrams: undefined,
    });
  });

  it('counts nothing for a profile that has never been weighed', () => {
    expect(summaryFor([])).toEqual({ count: 0 });
  });
});
