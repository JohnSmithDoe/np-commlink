import dayjs from 'dayjs';
import { statsKeysFrom } from '../util/office-time.utils';
import {
  selectDashboardStatsYear,
  toDashboardStatsMetrics,
} from './office-time-stats.selector';

const today = dayjs();

const keysFor = (officedays = [today]) =>
  statsKeysFrom({
    officedays,
    freedays: [],
    holidays: {},
    targetOfficeDaysPerWeek: 3,
  });

describe('office-time-stats.selector', () => {
  describe('selectDashboardStatsYear', () => {
    it('counts an office day in the current year', () => {
      expect(selectDashboardStatsYear.projector(keysFor()).officedays).toBe(1);
    });

    it('drops an office day from a previous year', () => {
      const lastYear = [today.subtract(1, 'year')];

      expect(
        selectDashboardStatsYear.projector(keysFor(lastYear)).officedays
      ).toBe(0);
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
