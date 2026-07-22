import dayjs from 'dayjs';
import {
  calculateStats,
  dayjsFromString,
  dayjsToString,
  deserializeIsoStringMap,
  deserializeIsoStrings,
  getTargetPercentage,
  isFreeday,
  isHoliday,
  isOfficeDay,
  isWeekend,
  serializeDateMap,
  serializeDates,
  validateFreedays,
} from './office-time.utils';

describe('office-time.utils', () => {
  describe('day predicates', () => {
    it('recognises weekends (Sat 2021-01-02, Sun 2021-01-03, Mon 2021-01-04)', () => {
      expect(isWeekend(dayjs('2021-01-02'))).toBe(true);
      expect(isWeekend(dayjs('2021-01-03'))).toBe(true);
      expect(isWeekend(dayjs('2021-01-04'))).toBe(false);
    });

    it('matches membership by day for freedays, holidays and office days', () => {
      const day = dayjs('2026-07-01');
      expect(isFreeday(day, [dayjs('2026-07-01T18:00:00')])).toBe(true);
      expect(isFreeday(day, [dayjs('2026-07-02')])).toBe(false);
      expect(isHoliday(day, [dayjs('2026-07-01')])).toBe(true);
      expect(isOfficeDay(day, [dayjs('2026-07-01')])).toBe(true);
      expect(isOfficeDay(day, [])).toBe(false);
      expect(isOfficeDay(day)).toBe(false);
    });
  });

  describe('getTargetPercentage', () => {
    it('is the ratio of office days to the pro-rated target', () => {
      // target = 10 * 5/5 = 10 days; 2/10 = 20%
      expect(getTargetPercentage(10, 2, 5)).toBe(20);
      // target = 10 * 2.5/5 = 5 days; 3/5 = 60%
      expect(getTargetPercentage(10, 3, 2.5)).toBe(60);
    });

    it('defaults to 100% when there is nothing to prorate', () => {
      expect(getTargetPercentage(0, 5, 5)).toBe(100);
      expect(getTargetPercentage(10, 5, 0)).toBe(100);
    });
  });

  describe('date (de)serialization', () => {
    it('round-trips a single date via YYYY-MM-DD (anchored at noon)', () => {
      const parsed = dayjsFromString('2026-07-01');
      expect(parsed?.hour()).toBe(12);
      expect(dayjsToString(parsed!)).toBe('2026-07-01');
    });

    it('returns null for an invalid date string', () => {
      expect(dayjsFromString('not-a-date')).toBeNull();
    });

    it('round-trips maps and arrays, dropping malformed entries', () => {
      expect(
        serializeDateMap(deserializeIsoStringMap({ xmas: '2026-12-25' }))
      ).toEqual({
        xmas: '2026-12-25',
      });
      const days = deserializeIsoStrings(['2026-07-01', 'bad', null as never]);
      expect(days).toHaveLength(1);
      expect(serializeDates(days)).toEqual(['2026-07-01']);
    });
  });

  describe('validateFreedays', () => {
    it('drops blanks and any day that is already a holiday', () => {
      const holidays = deserializeIsoStringMap({ h: '2026-07-02' });
      const result = validateFreedays(
        ['2026-07-01', '2026-07-02', null],
        holidays
      );
      expect(result.map((date) => dayjsToString(date))).toEqual(['2026-07-01']);
    });
  });

  describe('calculateStats', () => {
    it('counts office days in the current month and keeps invariants', () => {
      const monthStart = dayjs().startOf('month');
      const officedays = [
        monthStart.hour(12),
        monthStart.add(1, 'day').hour(12),
        monthStart.add(2, 'day').hour(12),
      ];

      const stats = calculateStats('month', {
        officedays,
        freedays: [],
        holidays: {},
        targetOfficeDaysPerWeek: 2.5,
      });

      expect(stats.officedays).toBe(3);
      expect(stats.freedays).toBe(0);
      expect(stats.holidays).toBe(0);
      // no holidays/freedays -> every workday counts
      expect(stats.workdays).toBe(stats.workdaysTotal);
      // targetdays is the pro-rated target, rounded to the nearest half day
      expect(stats.targetdays).toBe(
        Math.round(((stats.workdays * 2.5) / 5) * 2) / 2
      );
    });
  });
});
