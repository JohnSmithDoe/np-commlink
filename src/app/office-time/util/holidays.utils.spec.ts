import { berlinHolidaysFor } from './holidays.utils';

const on = (year: number, name: string): string =>
  berlinHolidaysFor(year)[name].format('YYYY-MM-DD');

describe('berlinHolidaysFor', () => {
  it('pins the fixed-date holidays', () => {
    expect(on(2026, 'Neujahr')).toBe('2026-01-01');
    expect(on(2026, 'Tag der Arbeit')).toBe('2026-05-01');
    expect(on(2026, 'Tag der Deutschen Einheit')).toBe('2026-10-03');
    expect(on(2026, '1. Weihnachtsfeiertag')).toBe('2026-12-25');
    expect(on(2026, '2. Weihnachtsfeiertag')).toBe('2026-12-26');
  });

  it('derives the movable holidays from Easter', () => {
    // Easter Sunday 2026 is 5 April.
    expect(on(2026, 'Karfreitag')).toBe('2026-04-03');
    expect(on(2026, 'Ostermontag')).toBe('2026-04-06');
    expect(on(2026, 'Christi Himmelfahrt')).toBe('2026-05-14');
    expect(on(2026, 'Pfingstmontag')).toBe('2026-05-25');
  });

  it('handles a March Easter, where the offsets cross a month boundary', () => {
    // Easter Sunday 2024 is 31 March — Karfreitag falls in March, the rest
    // after it.
    expect(on(2024, 'Karfreitag')).toBe('2024-03-29');
    expect(on(2024, 'Ostermontag')).toBe('2024-04-01');
    expect(on(2024, 'Christi Himmelfahrt')).toBe('2024-05-09');
  });

  it('handles the latest possible Easter', () => {
    // Easter Sunday 2038 is 25 April, the far end of the range.
    expect(on(2038, 'Ostermontag')).toBe('2038-04-26');
  });

  it('counts Internationaler Frauentag only from 2019', () => {
    expect(
      berlinHolidaysFor(2018)['Internationaler Frauentag']
    ).toBeUndefined();
    expect(on(2019, 'Internationaler Frauentag')).toBe('2019-03-08');
  });

  it('returns ten holidays for a current year', () => {
    expect(Object.keys(berlinHolidaysFor(2026))).toHaveLength(10);
  });
});
