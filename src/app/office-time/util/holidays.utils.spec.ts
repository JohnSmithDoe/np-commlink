import {
  ONE_OFF_LIBERATION_DAY_2025,
  PUBLISHED_YEARS,
  publishedBerlinHolidays,
} from '../testing/berlin-holidays.fixture';
import { berlinHolidaysFor } from './holidays.utils';

const on = (year: number, name: string): string =>
  berlinHolidaysFor(year)[name].format('YYYY-MM-DD');

const computedDates = (year: number): Record<string, string> =>
  Object.fromEntries(
    Object.entries(berlinHolidaysFor(year)).map(([name, date]) => [
      name,
      date.format('YYYY-MM-DD'),
    ])
  );

const ruleBasedDates = (year: number): Record<string, string> =>
  Object.fromEntries(
    Object.entries(publishedBerlinHolidays(year)).filter(
      ([name]) => name !== ONE_OFF_LIBERATION_DAY_2025
    )
  );

describe('berlinHolidaysFor', () => {
  it.each(PUBLISHED_YEARS)(
    'computes every date the %i list publishes, and no others',
    (year) => {
      expect(computedDates(year)).toEqual(ruleBasedDates(year));
    }
  );

  it('omits the one-off 80th-anniversary holiday of 2025', () => {
    expect(Object.keys(publishedBerlinHolidays(2025))).toContain(
      ONE_OFF_LIBERATION_DAY_2025
    );
    expect(
      berlinHolidaysFor(2025)[ONE_OFF_LIBERATION_DAY_2025]
    ).toBeUndefined();
  });

  it('handles the latest possible Easter', () => {
    expect(on(2038, 'Ostermontag')).toBe('2038-04-26');
  });

  it('counts Internationaler Frauentag only from 2019', () => {
    expect(
      berlinHolidaysFor(2018)['Internationaler Frauentag']
    ).toBeUndefined();
    expect(on(2019, 'Internationaler Frauentag')).toBe('2019-03-08');
  });
});
