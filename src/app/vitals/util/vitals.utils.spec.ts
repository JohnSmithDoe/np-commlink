import { mockProfile, mockReading } from '../testing/vitals.test-data';
import {
  favoriteAmong,
  nearestReadingUpTo,
  readingOn,
  readingsOf,
  summaryFor,
  withSoleFavorite,
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

describe('withSoleFavorite', () => {
  const profiles = [
    mockProfile({ id: 'ann' }),
    mockProfile({ id: 'bo', favorite: true }),
    mockProfile({ id: 'cat', type: 'pet' }),
  ];

  it('moves the flag rather than adding a second one', () => {
    const moved = withSoleFavorite(profiles, 'ann');
    expect(
      moved.filter(({ favorite }) => favorite).map(({ id }) => id)
    ).toEqual(['ann']);
  });

  it('drops the key instead of writing false', () => {
    expect(withSoleFavorite(profiles, 'ann')[1]).not.toHaveProperty('favorite');
  });

  it('leaves nobody starred when the id is gone', () => {
    expect(withSoleFavorite(profiles, 'nobody').some((p) => p.favorite)).toBe(
      false
    );
  });
});

describe('favoriteAmong', () => {
  it('is the sole person, with nothing stored', () => {
    const ann = mockProfile({ id: 'ann' });
    expect(favoriteAmong([ann])?.id).toBe('ann');
  });

  it('is nobody once there is more than one and none is starred', () => {
    expect(
      favoriteAmong([mockProfile({ id: 'ann' }), mockProfile({ id: 'bo' })])
    ).toBeUndefined();
  });

  it('is the starred one whenever there is one', () => {
    expect(
      favoriteAmong([
        mockProfile({ id: 'ann' }),
        mockProfile({ id: 'bo', favorite: true }),
      ])?.id
    ).toBe('bo');
  });
});
