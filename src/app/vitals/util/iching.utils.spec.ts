import {
  birthDigitSumFor,
  kiStarFor,
  kiYearFor,
  lifeNumberFor,
} from './iching.utils';

describe('kiYearFor', () => {
  it('takes the calendar year from 4 February on', () => {
    expect(kiYearFor('1980-02-04')).toBe(1980);
    expect(kiYearFor('1980-12-31')).toBe(1980);
  });

  it('hands a January birthday to the previous year', () => {
    expect(kiYearFor('1980-01-31')).toBe(1979);
    expect(kiYearFor('1980-02-03')).toBe(1979);
  });

  it('has no answer for an unparseable date', () => {
    expect(kiYearFor('')).toBeUndefined();
  });
});

describe('kiStarFor', () => {
  it('agrees with the published annual stars', () => {
    expect(kiStarFor('2020-06-01')?.number).toBe(7);
    expect(kiStarFor('2023-06-01')?.number).toBe(4);
    expect(kiStarFor('2026-06-01')?.number).toBe(1);
  });

  it('agrees with the "eleven minus the digit sum" rule', () => {
    expect(kiStarFor('1980-06-01')?.number).toBe(2);
    expect(kiStarFor('1975-06-01')?.number).toBe(7);
  });

  it('wraps 1 back to 9 rather than to 0', () => {
    expect(kiStarFor('2026-06-01')?.number).toBe(1);
    expect(kiStarFor('2027-06-01')?.number).toBe(9);
  });

  it('carries the February boundary into the star', () => {
    expect(kiStarFor('2026-02-03')?.number).toBe(2);
    expect(kiStarFor('2026-02-04')?.number).toBe(1);
  });

  it('names the trigram and the element that go with the number', () => {
    const star = kiStarFor('2026-06-01');

    expect(star?.trigram).toBe('☵');
    expect(star?.elementKey).toBe('vitals.astro.ki.element.water');
  });

  it('has no answer for an unparseable date', () => {
    expect(kiStarFor('nope')).toBeUndefined();
  });
});

describe('the life number', () => {
  it('sums every digit of the whole date, not just the year', () => {
    expect(birthDigitSumFor('1980-08-05')).toBe(31);
  });

  it('reduces the sum to a single digit', () => {
    expect(lifeNumberFor('1980-08-05')?.number).toBe(4);
  });

  it('is a different reading from the Ki star for the same date', () => {
    expect(kiStarFor('1980-08-05')?.number).toBe(2);
    expect(lifeNumberFor('1980-08-05')?.number).toBe(4);
  });

  it('moves with the day, where the Ki star jumps at the February turn', () => {
    expect(kiStarFor('1980-02-03')?.number).toBe(3);
    expect(kiStarFor('1980-02-04')?.number).toBe(2);

    expect(lifeNumberFor('1980-02-03')?.number).toBe(5);
    expect(lifeNumberFor('1980-02-04')?.number).toBe(6);
  });

  it('never reduces to zero for a real date', () => {
    const numbers = [
      '1900-01-01',
      '1999-12-31',
      '2026-08-23',
      '2000-09-09',
    ].map((iso) => lifeNumberFor(iso)?.number);

    for (const number of numbers) {
      expect(number).toBeGreaterThan(0);
      expect(number).toBeLessThan(10);
    }
  });

  it('has no answer for an unparseable date', () => {
    expect(lifeNumberFor('')).toBeUndefined();
    expect(birthDigitSumFor('')).toBeUndefined();
  });
});
