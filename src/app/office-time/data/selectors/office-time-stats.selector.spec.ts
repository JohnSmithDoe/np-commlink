import dayjs from 'dayjs';
import {
  selectDashboardStatsMonth,
  selectDashboardStatsQuarter,
  selectDashboardStatsWeek,
  selectDashboardStatsYear,
  toDashboardStatsMetrics,
} from './office-time-stats.selector';

// Anchored on `today` rather than fixed dates: the projectors call `dayjs()`
// internally to resolve "the current period", so a hardcoded date would make
// these assertions depend on the day the suite runs.
const today = dayjs();

const statsFor = (
  selector: typeof selectDashboardStatsYear,
  officedays = [today]
) => selector.projector(officedays, [], {}, 3);

describe('office-time-stats.selector', () => {
  describe('the period selectors', () => {
    // Every period contains today, so one office day today must surface in all
    // four — this is what proves each selector threads its own period through.
    it('counts an office day today in every period', () => {
      expect(statsFor(selectDashboardStatsYear).officedays).toBe(1);
      expect(statsFor(selectDashboardStatsQuarter).officedays).toBe(1);
      expect(statsFor(selectDashboardStatsMonth).officedays).toBe(1);
      expect(statsFor(selectDashboardStatsWeek).officedays).toBe(1);
    });

    it('nests the periods, so each window spans at least the next smaller one', () => {
      const year = statsFor(selectDashboardStatsYear).workdaysTotal;
      const quarter = statsFor(selectDashboardStatsQuarter).workdaysTotal;
      const month = statsFor(selectDashboardStatsMonth).workdaysTotal;
      const week = statsFor(selectDashboardStatsWeek).workdaysTotal;

      expect(year).toBeGreaterThanOrEqual(quarter);
      expect(quarter).toBeGreaterThanOrEqual(month);
      expect(month).toBeGreaterThanOrEqual(week);
      expect(week).toBeGreaterThan(0);
    });

    it('drops an office day that falls outside the period', () => {
      const lastYear = [today.subtract(1, 'year')];
      expect(statsFor(selectDashboardStatsYear, lastYear).officedays).toBe(0);
      expect(statsFor(selectDashboardStatsWeek, lastYear).officedays).toBe(0);
    });

    it('excludes free days and holidays from the workday count', () => {
      const plain = selectDashboardStatsWeek.projector([], [], {}, 3);
      const holiday = today.startOf('week').add(3, 'day');
      const reduced = selectDashboardStatsWeek.projector(
        [],
        [],
        { [holiday.format('YYYY-MM-DD')]: holiday },
        3
      );

      expect(reduced.holidays).toBe(1);
      expect(reduced.workdays).toBe(plain.workdays - 1);
    });
  });

  describe('toDashboardStatsMetrics', () => {
    it('narrows the stats to the two fields the dashboard read-model stores', () => {
      expect(
        toDashboardStatsMetrics({
          officedays: 7,
          percentage: 42,
          workdays: 20,
        } as never)
      ).toEqual({ officedays: 7, percentage: 42 });
    });
  });
});
