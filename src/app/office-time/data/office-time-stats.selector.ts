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

// The day-key sets are a function of the slice, not of the period, so they are
// their own memoized selector — the four cards share one build instead of each
// rebuilding them inside `calculateStats`. The cards themselves are NOT
// selectors: stats depend on what day it is too, and a memoized projector
// cannot expire. `OfficeTimeFacade` derives them against a refreshable `today`.
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

/**
 * The one stats projector that may still read the clock, because it is the only
 * one whose answer does not move with it: telemetry reports `officedays` and
 * `percentage` for the YEAR, and both count across the whole year rather than
 * up to today — so within a year they change only when the slice does. The
 * clock picks the year and nothing else, and the year boundary is exactly what
 * `OfficeTimeEffects.refreshOnYearRollover$` re-dispatches for.
 *
 * The four on-screen cards cannot make that argument — a month card is a day
 * stale the moment the month turns — which is why they are facade computeds.
 */
export const selectDashboardStatsYear = createSelector(
  selectStatsKeys,
  (keys) => calculateStats('year', keys, dayjsToday())
);

// office-time reports TWO fields to the dashboard read-model, so it supplies its
// own projector instead of the single-scalar `metric(key)` helper.
export const toDashboardStatsMetrics = (stats: {
  officedays: number;
  percentage: number;
}): { officedays: number; percentage: number } => ({
  officedays: stats.officedays,
  percentage: stats.percentage,
});
