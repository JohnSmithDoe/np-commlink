import {
  chineseCycleAround,
  chineseSignFor,
  chineseTimelineAround,
  chineseYearFor,
  chineseYearWindow,
  lunarNewYear,
  sexagenaryYearsOf,
} from './chinese-zodiac.utils';

describe('chineseYearFor', () => {
  it('keeps a late-January birthday in the previous lunar year', () => {
    expect(chineseYearFor('1990-01-26')).toBe(1989);
    expect(chineseYearFor('1990-01-27')).toBe(1990);
  });

  it('is undefined for an unparseable date', () => {
    expect(chineseYearFor('not-a-date')).toBeUndefined();
    expect(chineseSignFor('')).toBeUndefined();
  });
});

describe('chineseYearWindow', () => {
  it('names animal, element and polarity of a year', () => {
    const year = chineseYearWindow(2026);

    expect(year.sign.animal).toBe('horse');
    expect(year.element).toBe('fire');
    expect(year.polarity).toBe('yang');
  });

  it('reads the earth snake one day before the metal horse', () => {
    expect(chineseSignFor('1990-01-26')?.animal).toBe('snake');
    expect(chineseYearWindow(1989).element).toBe('earth');
    expect(chineseYearWindow(1989).polarity).toBe('yin');
    expect(chineseSignFor('1990-01-27')?.animal).toBe('horse');
    expect(chineseYearWindow(1990).element).toBe('metal');
  });

  it('runs from one lunar new year to the day before the next', () => {
    const year = chineseYearWindow(2026);

    expect(year.fromISO).toBe('2026-02-17');
    expect(year.toISO).toBe('2027-02-05');
  });
});

describe('lunarNewYear', () => {
  it('finds the first day of the lunar year', () => {
    expect(lunarNewYear(1984)).toBe('1984-02-02');
    expect(lunarNewYear(1990)).toBe('1990-01-27');
    expect(lunarNewYear(1900)).toBe('1900-01-31');
  });
});

describe('the corrected new years', () => {
  it('opens 2027 on 6 February, where ICU says the 7th', () => {
    expect(lunarNewYear(2027)).toBe('2027-02-06');
    expect(chineseYearFor('2027-02-06')).toBe(2027);
  });

  it('keeps 2 February 2030 in the old year, where ICU opens the new one', () => {
    expect(chineseYearFor('2030-02-02')).toBe(2029);
    expect(chineseYearFor('2030-02-03')).toBe(2030);
  });
});

describe('chineseTimelineAround', () => {
  it('lays the previous, current and next year back to back', () => {
    const timeline = chineseTimelineAround('2026-10-10');

    expect(timeline.map((year) => year.phase)).toEqual([
      'previous',
      'current',
      'next',
    ]);
    expect(timeline.map((year) => year.sign.animal)).toEqual([
      'snake',
      'horse',
      'goat',
    ]);
    expect(timeline[0]?.toISO).toBe('2026-02-16');
  });
});

describe('chineseCycleAround', () => {
  it('spans rat to pig of the cycle holding the date', () => {
    const cycle = chineseCycleAround('2026-10-10');

    expect(cycle).toHaveLength(12);
    expect(cycle[0]?.year).toBe(2020);
    expect(cycle.at(-1)?.sign.animal).toBe('pig');
  });
});

describe('sexagenaryYearsOf', () => {
  it('gives one year per element inside the sixty-year cycle', () => {
    expect(sexagenaryYearsOf('horse', '2026-10-10')).toEqual([
      1990, 2002, 2014, 2026, 2038,
    ]);
    expect(sexagenaryYearsOf('rat', '2044-03-01')[0]).toBe(2044);
  });
});
