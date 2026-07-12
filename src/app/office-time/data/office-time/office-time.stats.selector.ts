import { createSelector } from '@ngrx/store';
import { calculateStats } from './office-time.utils';
import {
  selectFreedays,
  selectHolidays,
  selectOfficedays,
  selectTargetOfficeDaysPerWeek,
} from './office-time.selector';
import dayjs from 'dayjs';

export const selectTodayIsOfficeDay = createSelector(
  selectOfficedays,
  (officeDays) => {
    const today = dayjs();
    return officeDays?.some((day) => day.isSame(today, 'day'));
  }
);

type Period = 'year' | 'quarter' | 'month' | 'week';

// eslint-disable-next-line @ngrx/prefix-selectors-with-select -- factory, not a selector
const makeStatsSelector = (period: Period) =>
  createSelector(
    selectOfficedays,
    selectFreedays,
    selectHolidays,
    selectTargetOfficeDaysPerWeek,
    (officedays, freedays, holidays, targetOfficeDaysPerWeek) =>
      calculateStats(period, {
        officedays,
        freedays,
        holidays,
        targetOfficeDaysPerWeek,
      })
  );

export const selectDashboardStatsYear = makeStatsSelector('year');
export const selectDashboardStatsQuarter = makeStatsSelector('quarter');
export const selectDashboardStatsMonth = makeStatsSelector('month');
export const selectDashboardStatsWeek = makeStatsSelector('week');
