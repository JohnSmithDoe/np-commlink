import {
  localizedDate,
  localizedLongDate,
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
