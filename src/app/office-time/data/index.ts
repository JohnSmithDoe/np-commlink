/**
 * Public API of the `office-time` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers (the office-time feature pages, the dash
 * smart-ui components, and the shell route file) get the action contracts,
 * the display/stats selectors, the pure date utils, and the lazy context
 * bundle, and nothing else. The reducers, effects, initial state, and the raw
 * feature selectors are module internals and stay hidden: importing them from
 * outside `office-time/data` is a Sheriff encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */

export { OfficeTimeActions } from './actions/office-time.actions';
export { OfficeTimeFacade } from './office-time.facade';

export {
  selectDashboardItems,
  selectDashboardSettings,
  selectFreedays,
  selectHolidayDays,
  selectHolidays,
  selectOfficedays,
  selectTargetOfficeDaysPerWeek,
} from './selectors/office-time.selector';

export {
  selectDashboardStatsMonth,
  selectDashboardStatsQuarter,
  selectDashboardStatsWeek,
  selectDashboardStatsYear,
} from './selectors/office-time-stats.selector';

export {
  dayjsFromString,
  dayjsToday,
  dayjsToString,
  freedayHighlights,
  holidayHighlights,
} from '../util/office-time.utils';

export { officeTimeContext } from './office-time.providers';
