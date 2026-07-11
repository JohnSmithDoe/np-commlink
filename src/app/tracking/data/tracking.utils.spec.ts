import { describe, expect, it } from 'vitest';
import { csvRow, formatSecondsAsClock } from './tracking.utils';

describe('tracking.utils', () => {
  describe('formatSecondsAsClock', () => {
    it('formats seconds as zero-padded HH:MM:SS', () => {
      expect(formatSecondsAsClock(0)).toBe('00:00:00');
      expect(formatSecondsAsClock(3661)).toBe('01:01:01');
      expect(formatSecondsAsClock(45296)).toBe('12:34:56');
    });

    it('clamps negative and fractional input', () => {
      expect(formatSecondsAsClock(-10)).toBe('00:00:00');
      expect(formatSecondsAsClock(59.9)).toBe('00:00:59');
    });
  });

  describe('csvRow', () => {
    it('joins plain fields with commas', () => {
      expect(csvRow(['a', 'b', 'c'])).toBe('a,b,c');
    });

    it('renders null/undefined as empty fields', () => {
      expect(csvRow(['x', null, undefined])).toBe('x,,');
    });

    it('quotes fields containing commas, quotes or newlines (RFC 4180)', () => {
      expect(csvRow(['a,b'])).toBe('"a,b"');
      expect(csvRow(['he said "hi"'])).toBe('"he said ""hi"""');
      expect(csvRow(['line1\nline2'])).toBe('"line1\nline2"');
    });
  });
});
