import dayjs, { Dayjs } from 'dayjs';
import { statsKeysFrom } from '../util/office-time.utils';
import { dayMap } from '../testing/office-time.test-data';
import { selectDashboardStatsYear } from './office-time-stats.selector';

const today = dayjs();

const keysFor = (officedays: Dayjs[] = [today], freedays: Dayjs[] = []) =>
  statsKeysFrom({
    officedays: dayMap(...officedays),
    freedays: dayMap(...freedays),
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

    it('reads free days off their own collection, not the office one', () => {
      const stats = selectDashboardStatsYear.projector(keysFor([], [today]));

      expect(stats.officedays).toBe(0);
      expect(stats.freedays).toBe(1);
    });

    it('counts a free day whether or not it lands on a weekend', () => {
      const saturday = today.startOf('year').day(6);
      const monday = saturday.add(2, 'day');

      expect(
        selectDashboardStatsYear.projector(keysFor([], [saturday, monday]))
          .freedays
      ).toBe(2);
    });
  });
});
