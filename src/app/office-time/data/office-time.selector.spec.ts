import dayjs from 'dayjs';
import { mockKernelState } from '../../@shared/testing/test-data';
import { dayMap, mockOfficeTimeState } from '../testing/office-time.test-data';
import {
  selectDashboardItems,
  selectDashboardSettings,
  selectFreedayKeys,
  selectFreedays,
  selectHolidayDays,
  selectHolidays,
  selectOfficedayKeys,
  selectOfficedays,
  selectOfficeTimeState,
  selectTargetOfficeDaysPerWeek,
} from './office-time.selector';

describe('office-time.selector', () => {
  it('selects the officeTime feature slice', () => {
    const officeTime = mockOfficeTimeState();
    expect(selectOfficeTimeState(mockKernelState({ officeTime }))).toBe(
      officeTime
    );
  });

  it('reads the plain configuration fields off the slice', () => {
    const state = mockOfficeTimeState({
      targetOfficeDaysPerWeek: 4,
      dashboardItems: ['date', 'stats-week'],
    });

    expect(selectTargetOfficeDaysPerWeek.projector(state)).toBe(4);
    expect(selectDashboardItems.projector(state)).toEqual([
      'date',
      'stats-week',
    ]);
    expect(selectDashboardSettings.projector(state)).toBe(
      state.dashboardSettings
    );
  });

  describe('day maps', () => {
    it('returns the stored days keyed by the day', () => {
      const state = mockOfficeTimeState({
        officedays: dayMap(dayjs('2024-03-04')),
        freedays: dayMap(dayjs('2024-03-05')),
      });

      expect(selectOfficedays.projector(state)).toEqual({ '2024-03-04': true });
      expect(selectFreedays.projector(state)).toEqual({ '2024-03-05': true });
    });

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
      const first = dayjs('2024-01-01');
      const second = dayjs('2024-12-25');
      const holidays = { '2024-01-01': first, '2024-12-25': second };

      expect(selectHolidays.projector(mockOfficeTimeState({ holidays }))).toBe(
        holidays
      );
      expect(selectHolidayDays.projector(holidays)).toEqual([first, second]);
    });

    it('is empty when no holidays have been fetched yet', () => {
      expect(selectHolidayDays.projector({})).toEqual([]);
    });
  });
});
