import dayjs from 'dayjs';
import { mockKernelState } from '../../../@shared/testing/test-data';
import { mockOfficeTimeState } from '../../testing/office-time.test-data';
import { IOfficeTimeState } from '../../model/office-time.types';
import {
  selectDashboardItems,
  selectDashboardSettings,
  selectFreedays,
  selectHolidayDays,
  selectHolidays,
  selectOfficedays,
  selectOfficeTimeState,
  selectTargetOfficeDaysPerWeek,
} from './office-time.selector';

// The persisted doc predates several of these fields, so a hydrated slice can
// arrive without them — which is what the `?? []` / `?? {}` defaults absorb.
const withoutDayLists = () =>
  mockOfficeTimeState({
    officedays: undefined as never,
    freedays: undefined as never,
    holidays: undefined as never,
  }) as IOfficeTimeState;

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

  describe('day lists', () => {
    it('returns the stored days', () => {
      const officeday = dayjs('2024-03-04');
      const freeday = dayjs('2024-03-05');
      const state = mockOfficeTimeState({
        officedays: [officeday],
        freedays: [freeday],
      });

      expect(selectOfficedays.projector(state)).toEqual([officeday]);
      expect(selectFreedays.projector(state)).toEqual([freeday]);
    });

    it('defaults office days and free days to empty when the slice omits them', () => {
      const state = withoutDayLists();

      expect(selectOfficedays.projector(state)).toEqual([]);
      expect(selectFreedays.projector(state)).toEqual([]);
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

    it('is empty when the slice carries no holiday map', () => {
      expect(selectHolidays.projector(withoutDayLists())).toBeUndefined();
      expect(selectHolidayDays.projector(undefined as never)).toEqual([]);
    });
  });
});
