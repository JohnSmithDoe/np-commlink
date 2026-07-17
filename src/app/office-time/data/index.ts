/**
 * Public API of the `office-time` data module (Sheriff barrel).
 *
 * Facade-only surface — consumers (the office-time feature pages, the dash
 * smart-ui components, and the shell route file) get the action contracts,
 * the display/stats selectors, the pure date utils, and the lazy providers,
 * and nothing else. The reducers, effects, load/save/telemetry effects,
 * initial state, and the raw feature selectors are module internals and stay
 * hidden: importing them from outside `office-time/data` is a Sheriff
 * encapsulation violation.
 *
 * Named re-exports only (never `export *`) so the public surface is explicit
 * and a type-only consumer can't drag runtime providers into its chunk.
 */

// Action contracts
export { OfficeTimeActions } from './office-time/office-time.actions';
export { SettingsActions } from './settings/settings.actions';

// Display selectors
export {
  selectDashboardItems,
  selectDashboardSettings,
  selectFreedays,
  selectHolidayDays,
  selectHolidays,
  selectOfficedays,
  selectTargetOfficeDaysPerWeek,
} from './office-time/office-time.selector';

// Stats selectors
export {
  selectDashboardStatsMonth,
  selectDashboardStatsQuarter,
  selectDashboardStatsWeek,
  selectDashboardStatsYear,
  selectTodayIsOfficeDay,
} from './office-time/office-time.stats.selector';

// Pure date utils
export {
  dayjsFromString,
  dayjsToday,
  dayjsToString,
  daysToFreedaysHighlightsInputTransform,
  daysToHolidaysHighlightsInputTransform,
} from './office-time/office-time.utils';

// Lazy providers (state + effects)
export { officeTimeLazyProviders } from './provide-office-time-lazy';
