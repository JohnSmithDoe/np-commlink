import { LocalizedDatePipe } from './localized-date.pipe';

describe('LocalizedDatePipe', () => {
  const pipe = new LocalizedDatePipe();

  it('renders an ISO date as a numeric date', () => {
    expect(pipe.transform('2026-07-27')).toMatch(/\d{2}[./]\d{2}[./]\d{4}/);
  });

  it('renders nothing for an absent date', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
