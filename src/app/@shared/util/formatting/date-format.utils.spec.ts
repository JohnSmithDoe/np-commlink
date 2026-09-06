import {
  localizedDate,
  localizedLongDate,
  parseClock,
  setDayjsLocale,
} from './date-format.utils';

describe('the localized date helpers', () => {
  afterEach(() => setDayjsLocale('de'));

  it('formats a real date rather than echoing the pattern', () => {
    setDayjsLocale('de');
    expect(localizedDate('2026-07-27')).toBe('27.07.2026');
    expect(localizedLongDate('2026-07-27')).toBe('27. Juli 2026');
  });

  it('follows the active dayjs locale', () => {
    setDayjsLocale('en');
    expect(localizedDate('2026-07-27')).toBe('07/27/2026');
    expect(localizedLongDate('2026-07-27')).toBe('July 27, 2026');
  });

  it('actually switches, rather than keeping the previous locale', () => {
    setDayjsLocale('en');
    const english = localizedDate('2026-07-27');
    setDayjsLocale('de');
    expect(localizedDate('2026-07-27')).not.toBe(english);
  });
});

describe('parseClock', () => {
  it('reads a padded and an unpadded time alike', () => {
    expect(parseClock('09:05')).toEqual({ hour: 9, minute: 5 });
    expect(parseClock('9:5')).toEqual({ hour: 9, minute: 5 });
    expect(parseClock('23:59')).toEqual({ hour: 23, minute: 59 });
  });

  it('refuses a time no clock shows, rather than passing it to the scheduler', () => {
    expect(parseClock('99:99')).toBeUndefined();
    expect(parseClock('24:00')).toBeUndefined();
    expect(parseClock('12:60')).toBeUndefined();
    expect(parseClock('-1:30')).toBeUndefined();
  });

  it('refuses a shape that is not two numbers', () => {
    expect(parseClock('8')).toBeUndefined();
    expect(parseClock('8:')).toBeUndefined();
    expect(parseClock('1:2:3')).toBeUndefined();
    expect(parseClock('')).toBeUndefined();
    expect(parseClock(830)).toBeUndefined();
    expect(parseClock(undefined)).toBeUndefined();
  });
});
