import dayjs from 'dayjs';
import { dayMap } from '../testing/office-time.test-data';
import { holidayMapFrom } from '../util/office-time.utils';
import {
  selectFreedayKeys,
  selectHolidayDays,
  selectOfficedayKeys,
} from './office-time.selector';

describe('office-time.selector', () => {
  describe('day maps', () => {
    it('hands the view its keys in date order, whatever order they were written', () => {
      const late = dayjs('2024-03-09');
      const early = dayjs('2024-03-04');

      expect(selectOfficedayKeys.projector(dayMap(late, early))).toEqual([
        '2024-03-04',
        '2024-03-09',
      ]);
      expect(selectFreedayKeys.projector(dayMap(late, early))).toEqual([
        '2024-03-04',
        '2024-03-09',
      ]);
    });
  });

  describe('selectHolidayDays', () => {
    it('flattens the keyed holiday map into its days', () => {
      const holidays = holidayMapFrom({
        Neujahr: '2024-01-01',
        Weihnachten: '2024-12-25',
      });

      expect(selectHolidayDays.projector(holidays)).toEqual([
        '2024-01-01',
        '2024-12-25',
      ]);
    });

    it('is empty when no holidays have been fetched yet', () => {
      expect(selectHolidayDays.projector({})).toEqual([]);
    });
  });
});
