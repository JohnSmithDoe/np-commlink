import { createSelector } from '@ngrx/store';
import { calculateStats } from '../../util/office-time.utils';
import {
  selectFreedays,
  selectHolidays,
  selectOfficedays,
  selectTargetOfficeDaysPerWeek,
} from './office-time.selector';

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

// office-time reports TWO fields to the dashboard read-model, so it supplies its
// own projector instead of the single-scalar `metric(key)` helper.
export const toDashboardStatsMetrics = (stats: {
  officedays: number;
  percentage: number;
}): { officedays: number; percentage: number } => ({
  officedays: stats.officedays,
  percentage: stats.percentage,
});
