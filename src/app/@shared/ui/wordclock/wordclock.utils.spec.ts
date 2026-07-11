import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  ActiveWord,
  computeFace,
  isWordActive,
  TSettings,
} from './wordclock.utils';

const at = (time: string) => dayjs(`2026-01-05T${time}:00`); // Mon, arbitrary day

const base: TSettings = {
  targetDate: '',
  showCorners: false,
  deZwanzigNach: false,
  deZwanzigVor: false,
  deDreiviertel: false,
};

const words = (config: TSettings | undefined, time: string): string[] =>
  computeFace(at(time), config).activeWords.map((w) => w.word);

describe('wordclock.utils', () => {
  describe('computeFace — the hours', () => {
    it('always lights ES and IST', () => {
      expect(words(base, '09:00')).toEqual(
        expect.arrayContaining(['ES', 'IST'])
      );
      expect(words(undefined, '09:00')).toEqual(
        expect.arrayContaining(['ES', 'IST'])
      );
    });

    it('reads full hours as "<hour> UHR"', () => {
      expect(words(base, '09:00')).toEqual(['ES', 'IST', 'UHR', 'NEUN']);
      expect(words(base, '12:00')).toEqual(['ES', 'IST', 'UHR', 'ZWÖLF']);
    });

    it("says EIN (not EINS) at one o'clock exactly", () => {
      expect(words(base, '13:00')).toContain('EIN');
      expect(words(base, '13:00')).not.toContain('EINS');
      expect(words(base, '13:05')).toContain('EINS');
    });
  });

  describe('computeFace — the five-minute steps', () => {
    it('rounds to the nearest five minutes', () => {
      // 09:07 rounds down to 09:05 -> "fünf nach neun"
      expect(words(base, '09:07')).toEqual([
        'ES',
        'IST',
        'FÜNF',
        'NACH',
        'NEUN',
      ]);
    });

    it('rolls the hour forward from half past onward', () => {
      // half past nine -> "halb zehn"
      expect(words(base, '09:30')).toEqual(['ES', 'IST', 'HALB', 'ZEHN']);
    });

    it('handles quarters', () => {
      expect(words(base, '09:15')).toEqual([
        'ES',
        'IST',
        'VIERTEL',
        'NACH',
        'NEUN',
      ]);
      expect(words(base, '09:45')).toEqual([
        'ES',
        'IST',
        'VIERTEL',
        'VOR',
        'ZEHN',
      ]);
    });
  });

  describe('computeFace — German regional variants', () => {
    it('switches twenty-past between "zehn vor halb" and "zwanzig nach"', () => {
      expect(words(base, '09:20')).toEqual(
        expect.arrayContaining(['ZEHN', 'VOR', 'HALB'])
      );
      expect(words({ ...base, deZwanzigNach: true }, '09:20')).toEqual(
        expect.arrayContaining(['ZWANZIG', 'NACH'])
      );
    });

    it('switches quarter-to between "viertel vor" and "dreiviertel"', () => {
      expect(words(base, '09:45')).toEqual(
        expect.arrayContaining(['VIERTEL', 'VOR'])
      );
      expect(words({ ...base, deDreiviertel: true }, '09:45')).toEqual(
        expect.arrayContaining(['DREI', 'VIERTEL'])
      );
    });
  });

  describe('computeFace — corner minute dots', () => {
    it('lights corners cumulatively for minutes past the five-step', () => {
      const cfg = { ...base, showCorners: true };
      // 09:03 -> 3 minutes past 09:00 -> three corners lit (bottom-left off)
      expect(computeFace(at('09:03'), cfg).corners).toEqual({
        topLeft: true,
        topRight: true,
        botRight: true,
        botLeft: false,
      });
      // 09:04 -> all four
      expect(computeFace(at('09:04'), cfg).corners).toEqual({
        topLeft: true,
        topRight: true,
        botRight: true,
        botLeft: true,
      });
    });

    it('leaves every corner dark when corners are disabled', () => {
      expect(computeFace(at('09:03'), base).corners).toEqual({
        topLeft: false,
        topRight: false,
        botLeft: false,
        botRight: false,
      });
    });
  });

  describe('isWordActive', () => {
    const row = 'ABESCD'.split(''); // "ES" spans index 2..3
    const active: ActiveWord[] = [{ word: 'ES', row: -1 }];

    it('marks the letters inside the active word span', () => {
      expect(isWordActive(active, row, 'E', 2, 0)).toBe(true);
      expect(isWordActive(active, row, 'S', 3, 0)).toBe(true);
    });

    it('ignores letters outside the word', () => {
      expect(isWordActive(active, row, 'A', 0, 0)).toBe(false);
    });

    it('honours a row pin so repeated words only light on their row', () => {
      const pinned: ActiveWord[] = [{ word: 'ES', row: 1 }];
      expect(isWordActive(pinned, row, 'E', 2, 1)).toBe(true);
      expect(isWordActive(pinned, row, 'E', 2, 0)).toBe(false);
    });
  });
});
