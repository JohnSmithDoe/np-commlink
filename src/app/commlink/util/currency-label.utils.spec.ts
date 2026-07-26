import { currencyLabel } from './currency-label.utils';

describe('currencyLabel', () => {
  it('renders cyberpunk flavor for the cyberpunk theme', () => {
    expect(currencyLabel('cyberpunk', 1234)).toBe('¥ 1234 nyen');
  });

  it('renders real EUR formatting for the boomer theme', () => {
    const out = currencyLabel('boomer', 1234);
    expect(out).toContain('1.234,00');
    expect(out).toContain('€');
  });

  it('renders zero', () => {
    expect(currencyLabel('cyberpunk', 0)).toBe('¥ 0 nyen');
    expect(currencyLabel('boomer', 0)).toContain('0,00');
  });

  it('renders a negative balance (e.g. overdraft)', () => {
    expect(currencyLabel('cyberpunk', -50)).toBe('¥ -50 nyen');
    expect(currencyLabel('boomer', -50)).toContain('-');
  });
});
