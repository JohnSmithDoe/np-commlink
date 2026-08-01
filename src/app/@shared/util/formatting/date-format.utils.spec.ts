import {
  localizedDate,
  localizedLongDate,
  setDayjsLocale,
} from './date-format.utils';

describe('the localized date helpers', () => {
  afterEach(() => setDayjsLocale('de'));

  // The trap these helpers exist to close: `format('L')` on a dayjs without the
  // `localizedFormat` plugin returns the *string* `"L"`, and nothing in the type
  // system objects. Importing the helper is what loads the plugin, so asserting
  // the output is not the pattern is asserting that the wiring holds.
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

  // The German pack is the other half of the same trap: `dayjs.locale('de')`
  // without it silently keeps the locale that was already active.
  it('actually switches, rather than keeping the previous locale', () => {
    setDayjsLocale('en');
    const english = localizedDate('2026-07-27');
    setDayjsLocale('de');
    expect(localizedDate('2026-07-27')).not.toBe(english);
  });
});
