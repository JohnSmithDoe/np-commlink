import { LocalizedDatePipe } from './localized-date.pipe';

// The underlying `localizedDate` reads dayjs's active locale, which the app sets
// once at boot; the suite runs under the default. So this asserts the pipe's own
// contract — the empty-input guard and that a real date reaches the formatter —
// rather than re-testing dayjs's locale table.
describe('LocalizedDatePipe', () => {
  const pipe = new LocalizedDatePipe();

  it('renders an ISO date as a numeric date', () => {
    expect(pipe.transform('2026-07-27')).toMatch(/\d{2}[./]\d{2}[./]\d{4}/);
  });

  // Every date field in the app is clearable, so the falsy cases are the ones
  // that actually arrive — and `dayjs('')` would otherwise format as the string
  // "Invalid Date".
  it('renders nothing for an absent date', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
