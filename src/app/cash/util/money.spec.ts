import { centsToEur, centsToInput, eurToCents, formatEur } from './money';

describe('money util', () => {
  describe('eurToCents', () => {
    it('parses whole euros as cents', () => {
      expect(eurToCents('12')).toBe(1200);
    });

    it('parses a decimal comma amount', () => {
      expect(eurToCents('12,34')).toBe(1234);
    });

    it('treats "." as a thousands separator (de-DE)', () => {
      expect(eurToCents('1.234,56')).toBe(123456);
      expect(eurToCents('1.234')).toBe(123400);
    });

    it('honours a leading minus sign', () => {
      expect(eurToCents('-5')).toBe(-500);
      expect(eurToCents('-12,50')).toBe(-1250);
    });

    it('tolerates a € sign and whitespace', () => {
      expect(eurToCents(' € 12,00 ')).toBe(1200);
    });

    it('pads a single decimal digit and truncates extra ones', () => {
      expect(eurToCents('1,5')).toBe(150);
      expect(eurToCents('1,999')).toBe(199);
    });

    it('parses a bare decimal', () => {
      expect(eurToCents(',5')).toBe(50);
    });

    it('rejects empty and junk input', () => {
      expect(eurToCents('')).toBeNull();
      expect(eurToCents('   ')).toBeNull();
      expect(eurToCents('abc')).toBeNull();
      expect(eurToCents(',')).toBeNull();
    });

    it('rejects a stray second decimal separator', () => {
      expect(eurToCents('1,2,3')).toBeNull();
      expect(eurToCents('12,,3')).toBeNull();
    });
  });

  describe('centsToEur', () => {
    it('divides by 100', () => {
      expect(centsToEur(1234)).toBe(12.34);
      expect(centsToEur(-500)).toBe(-5);
    });
  });

  describe('centsToInput', () => {
    it('produces a grouping-free de-DE decimal that round-trips', () => {
      expect(centsToInput(1234)).toBe('12,34');
      expect(centsToInput(123456)).toBe('1234,56');
      expect(eurToCents(centsToInput(-1250))).toBe(-1250);
    });
  });

  describe('formatEur', () => {
    // ICU whitespace before the symbol varies by runtime; assert on the parts.
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
  });
});
