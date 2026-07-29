import { centsToEur, centsToInput, eurToCents } from './money.utils';

describe('money util', () => {
  describe('eurToCents', () => {
    it('parses whole euros as cents', () => {
      expect(eurToCents('12')).toBe(1200);
    });

    it('parses a decimal comma amount', () => {
      expect(eurToCents('12,34')).toBe(1234);
    });

    it('treats "." as a thousands separator (de-DE)', () => {
      expect(eurToCents('1.234,56')).toBe(123_456);
      expect(eurToCents('1.234')).toBe(123_400);
    });

    it('honours a leading minus sign', () => {
      expect(eurToCents('-5')).toBe(-500);
      expect(eurToCents('-12,50')).toBe(-1250);
    });

    it('honours a trailing minus sign', () => {
      expect(eurToCents('5-')).toBe(-500);
      expect(eurToCents('12,50-')).toBe(-1250);
    });

    it('tolerates a € sign and whitespace', () => {
      expect(eurToCents(' € 12,00 ')).toBe(1200);
    });

    it('honours a minus sign on either side of a € sign', () => {
      expect(eurToCents('-€ 12,00')).toBe(-1200);
      expect(eurToCents('€ -12,00')).toBe(-1200);
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
      expect(eurToCents(' '.repeat(3))).toBeNull();
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
      expect(centsToInput(123_456)).toBe('1234,56');
      expect(eurToCents(centsToInput(-1250))).toBe(-1250);
    });
  });

  // The two conventions are mutually ambiguous — `1.234` is 1234 € in German and
  // 1.23 € in English — which is why the language is a parameter rather than a
  // guess, and why a stored threshold is always read as German.
  describe('the language flip', () => {
    it('reads the English convention when asked to', () => {
      expect(eurToCents('12.34', 'en')).toBe(1234);
      expect(eurToCents('1,234.56', 'en')).toBe(123_456);
      expect(eurToCents('1,234', 'en')).toBe(123_400);
    });

    // The dangerous half, and the reason `language` is a required decision rather
    // than a default: neither string is *invalid* in the other convention, so
    // nothing can be rejected. `12,34` read as English is 1234 € — a hundredfold
    // error, silently. This is what makes a canonical storage language for
    // persisted thresholds mandatory rather than tidy.
    it('reads the other language’s decimal as ITS OWN grouping, not as an error', () => {
      expect(eurToCents('12,34', 'en')).toBe(123_400);
      expect(eurToCents('12.34', 'de')).toBe(123_400);
    });

    it('round-trips through centsToInput per language', () => {
      expect(centsToInput(1234, 'en')).toBe('12.34');
      expect(eurToCents(centsToInput(-123_456, 'en'), 'en')).toBe(-123_456);
      expect(eurToCents(centsToInput(-123_456, 'de'), 'de')).toBe(-123_456);
    });

    // A `.` is a regex metacharacter: an unescaped decimal separator would make
    // the "is this a plain amount" test match any character at all.
    it('does not let junk through as an English decimal', () => {
      expect(eurToCents('1x23', 'en')).toBeNull();
      expect(eurToCents('12.3.4', 'en')).toBeNull();
    });
  });
});
