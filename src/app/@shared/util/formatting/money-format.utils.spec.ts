import { formatEur } from './money-format.utils';

describe('formatEur', () => {
  it('formats cents as a EUR currency string', () => {
    const out = formatEur(1234);
    expect(out).toContain('12,34');
    expect(out).toContain('€');
  });

  it('keeps the sign for outflows', () => {
    expect(formatEur(-1999)).toContain('-');
    expect(formatEur(-1999)).toContain('19,99');
  });

  it('formats zero', () => {
    expect(formatEur(0)).toContain('0,00');
  });

  it('spells a negated nothing as zero, not as minus zero', () => {
    expect(formatEur(-0)).not.toContain('-');
  });
});
