import { ScorePipe } from './score.pipe';

describe('ScorePipe', () => {
  const pipe = new ScorePipe();

  it('formats with de-DE thousands separators', () => {
    expect(pipe.transform(42)).toBe('42');
    expect(pipe.transform(12_345)).toBe('12.345');
    expect(pipe.transform(1_000_000)).toBe('1.000.000');
  });

  it('renders falsy values as "0"', () => {
    expect(pipe.transform(0)).toBe('0');
    expect(pipe.transform(null)).toBe('0');
    expect(pipe.transform(undefined)).toBe('0');
  });

  it('renders non-finite values as "0"', () => {
    expect(pipe.transform(Number.NaN)).toBe('0');
    expect(pipe.transform(Infinity)).toBe('0');
    expect(pipe.transform(-Infinity)).toBe('0');
  });
});
