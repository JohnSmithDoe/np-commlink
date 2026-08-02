import dayjs from 'dayjs';
import {
  calculateStats,
  statsKeysFrom,
  dayjsFromString,
  dayjsToString,
  deserializeIsoStringMap,
  deserializeIsoStrings,
  getTargetPercentage,
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

    it('matches membership by day for office days', () => {
      const day = dayjs('2026-07-01');
      expect(isOfficeDay(day, [dayjs('2026-07-01T18:00:00')])).toBe(true);
      expect(isOfficeDay(day, [dayjs('2026-07-02')])).toBe(false);
      expect(isOfficeDay(day, [dayjs('2026-07-01')])).toBe(true);
      expect(isOfficeDay(day, [])).toBe(false);
      expect(isOfficeDay(day)).toBe(false);
    });
  });

  describe('getTargetPercentage', () => {
    it('is the ratio of office days to the pro-rated target', () => {
      expect(getTargetPercentage(10, 2, 5)).toBe(20);
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

    it('matches a holiday by day even if it carries a time component', () => {
      const holidays = { h: dayjs('2026-07-02T23:00:00') };
      const result = validateFreedays(['2026-07-02'], holidays);
      expect(result).toEqual([]);
    });
  });

  describe('calculateStats', () => {
    const TODAY = dayjs('2026-08-01').hour(12); // a Saturday
    const keysFor = (
      officedays: dayjs.Dayjs[] = [TODAY],
      holidays: Record<string, dayjs.Dayjs> = {},
      targetOfficeDaysPerWeek = 3
    ) =>
      statsKeysFrom({
        officedays,
        freedays: [],
        holidays,
        targetOfficeDaysPerWeek,
      });

    it('counts office days in the current month and keeps invariants', () => {
      const monthStart = TODAY.startOf('month');
      const officedays = [
        monthStart.hour(12),
        monthStart.add(1, 'day').hour(12),
        monthStart.add(2, 'day').hour(12),
      ];

      const stats = calculateStats(
        'month',
        keysFor(officedays, {}, 2.5),
        TODAY
      );

      expect(stats.officedays).toBe(3);
      expect(stats.freedays).toBe(0);
      expect(stats.holidays).toBe(0);
      expect(stats.workdays).toBe(stats.workdaysTotal);
      expect(stats.targetdays).toBe(
        Math.round(((stats.workdays * 2.5) / 5) * 2) / 2
      );
    });

    it('counts an office day today in every period', () => {
      for (const period of ['year', 'quarter', 'month', 'week'] as const) {
        expect(calculateStats(period, keysFor(), TODAY).officedays).toBe(1);
      }
    });

    it('nests the periods, so each window spans at least the next smaller one', () => {
      const [year, quarter, month, week] = (
        ['year', 'quarter', 'month', 'week'] as const
      ).map((period) => calculateStats(period, keysFor(), TODAY).workdaysTotal);

      expect(year).toBeGreaterThanOrEqual(quarter);
      expect(quarter).toBeGreaterThanOrEqual(month);
      expect(month).toBeGreaterThanOrEqual(week);
      expect(week).toBeGreaterThan(0);
    });

    it('drops an office day that falls outside the period', () => {
      const lastYear = [TODAY.subtract(1, 'year')];

      expect(calculateStats('year', keysFor(lastYear), TODAY).officedays).toBe(
        0
      );
      expect(calculateStats('week', keysFor(lastYear), TODAY).officedays).toBe(
        0
      );
    });

    it('excludes free days and holidays from the workday count', () => {
      const holiday = TODAY.startOf('week').add(3, 'day');
      const plain = calculateStats('week', keysFor([]), TODAY);
      const reduced = calculateStats(
        'week',
        keysFor([], { [holiday.format('YYYY-MM-DD')]: holiday }),
        TODAY
      );

      expect(reduced.holidays).toBe(1);
      expect(reduced.workdays).toBe(plain.workdays - 1);
    });

    it('reports a different window when the day rolls into a new month', () => {
      const july = dayjs('2026-07-31').hour(12);
      const keys = keysFor([july]);

      expect(calculateStats('month', keys, july).officedays).toBe(1);
      expect(calculateStats('month', keys, TODAY).officedays).toBe(0);
    });
  });
});
