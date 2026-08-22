import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OfficeTimeState } from '../model/office-time.types';
import { dayKeysOf } from '../util/office-time.utils';

export const OFFICE_TIME_STATE_KEY = 'officeTime';

export const selectOfficeTimeState = createFeatureSelector<OfficeTimeState>(
  OFFICE_TIME_STATE_KEY
);

export const selectDashboardSettings = createSelector(
  selectOfficeTimeState,
  (state) => state.dashboardSettings
);

export const selectOfficeReminder = createSelector(
  selectOfficeTimeState,
  (state) => state.reminder
);

export const selectDashboardItems = createSelector(
  selectOfficeTimeState,
  (state) => state.dashboardItems
);

export const selectTargetOfficeDaysPerWeek = createSelector(
  selectOfficeTimeState,
  (state) => state.targetOfficeDaysPerWeek
);

export const selectHolidays = createSelector(
  selectOfficeTimeState,
  (state) => state.holidays
);

export const selectHolidayDays = createSelector(selectHolidays, (holidays) =>
  Object.values(holidays)
);

export const selectOfficedays = createSelector(
  selectOfficeTimeState,
  (state) => state.officedays
);

export const selectFreedays = createSelector(
  selectOfficeTimeState,
  (state) => state.freedays
);

export const selectOfficedayKeys = createSelector(selectOfficedays, dayKeysOf);

export const selectFreedayKeys = createSelector(selectFreedays, dayKeysOf);
