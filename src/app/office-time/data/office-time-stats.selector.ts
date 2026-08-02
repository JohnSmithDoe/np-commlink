import { createSelector } from '@ngrx/store';
import {
  calculateStats,
  dayjsToday,
  statsKeysFrom,
} from '../util/office-time.utils';
import {
  selectFreedays,
  selectHolidays,
  selectOfficedays,
  selectTargetOfficeDaysPerWeek,
} from './office-time.selector';

export const selectStatsKeys = createSelector(
  selectOfficedays,
  selectFreedays,
  selectHolidays,
  selectTargetOfficeDaysPerWeek,
  (officedays, freedays, holidays, targetOfficeDaysPerWeek) =>
    statsKeysFrom({
      officedays,
      freedays,
      holidays,
      targetOfficeDaysPerWeek,
    })
);

export const selectDashboardStatsYear = createSelector(
  selectStatsKeys,
  (keys) => calculateStats('year', keys, dayjsToday())
);

export const toDashboardStatsMetrics = (stats: {
  officedays: number;
  percentage: number;
}): { officedays: number; percentage: number } => ({
  officedays: stats.officedays,
  percentage: stats.percentage,
});
