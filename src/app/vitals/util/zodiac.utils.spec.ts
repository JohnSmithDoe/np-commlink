import {
  astroAgeFor,
  zodiacSignFor,
  zodiacTimelineAround,
  zodiacYear,
} from './zodiac.utils';

describe('zodiacYear', () => {
  it('lays out all twelve windows back to back', () => {
    const windows = zodiacYear('2026-08-23');

    expect(windows).toHaveLength(12);
    expect(windows[0]?.sign.sign).toBe('aquarius');
    expect(windows[0]?.fromISO).toBe('2026-01-20');
    expect(windows.at(-1)?.sign.sign).toBe('capricorn');
  });

  it('closes each window the day before the next one opens', () => {
    const windows = zodiacYear('2026-08-23');

    expect(windows[0]?.toISO).toBe('2026-02-18');
    expect(windows[1]?.fromISO).toBe('2026-02-19');
  });

  it('carries the last window into the following January', () => {
    expect(zodiacYear('2026-08-23').at(-1)?.toISO).toBe('2027-01-19');
  });

  it('is empty for an unparseable date', () => {
    expect(zodiacYear('not-a-date')).toEqual([]);
  });
});

describe('zodiacSignFor', () => {
  it('names the sign of a date inside a season', () => {
    expect(zodiacSignFor('1980-08-05')?.sign).toBe('leo');
  });

  it('takes the sign that starts ON the boundary day', () => {
    expect(zodiacSignFor('1980-08-23')?.sign).toBe('virgo');
    expect(zodiacSignFor('1980-08-22')?.sign).toBe('leo');
  });

  it('reaches back over the new year for early January', () => {
    expect(zodiacSignFor('2026-01-05')?.sign).toBe('capricorn');
    expect(zodiacSignFor('2026-01-20')?.sign).toBe('aquarius');
  });

  it('has no answer for an unparseable date', () => {
    expect(zodiacSignFor('')).toBeUndefined();
  });
});

describe('zodiacTimelineAround', () => {
  it('brackets the current season with its neighbours', () => {
    const timeline = zodiacTimelineAround('2026-08-23');

    expect(timeline.map((season) => season.sign.sign)).toEqual([
      'leo',
      'virgo',
      'libra',
    ]);
    expect(timeline.map((season) => season.phase)).toEqual([
      'previous',
      'current',
      'next',
    ]);
  });

  it('ends a season the day before the next one opens', () => {
    const [, current] = zodiacTimelineAround('2026-08-23');

    expect(current?.fromISO).toBe('2026-08-23');
    expect(current?.toISO).toBe('2026-09-22');
  });

  it('spans the year boundary for a Capricorn date', () => {
    const [, current] = zodiacTimelineAround('2026-01-05');

    expect(current?.fromISO).toBe('2025-12-22');
    expect(current?.toISO).toBe('2026-01-19');
  });

  it('is empty for an unparseable date', () => {
    expect(zodiacTimelineAround('not-a-date')).toEqual([]);
  });
});

describe('astroAgeFor', () => {
  it('places today in the Age of Pisces', () => {
    expect(astroAgeFor('2026-08-23')?.sign).toBe('pisces');
  });

  it('hands the age over on the boundary year', () => {
    expect(astroAgeFor('2150-12-31')?.sign).toBe('pisces');
    expect(astroAgeFor('2151-01-01')?.sign).toBe('aquarius');
  });

  it('has no answer for an unparseable date', () => {
    expect(astroAgeFor('')).toBeUndefined();
  });
});
