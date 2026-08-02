import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OfficeTimeState } from '../model/office-time.types';

export const OFFICE_TIME_STATE_KEY = 'officeTime';

export const selectOfficeTimeState = createFeatureSelector<OfficeTimeState>(
  OFFICE_TIME_STATE_KEY
);

export const selectDashboardSettings = createSelector(
  selectOfficeTimeState,
  (state) => {
    return state.dashboardSettings;
  }
);

export const selectDashboardItems = createSelector(
  selectOfficeTimeState,
  (state) => {
    return state.dashboardItems;
  }
);
export const selectTargetOfficeDaysPerWeek = createSelector(
  selectOfficeTimeState,
  (state) => {
    return state.targetOfficeDaysPerWeek;
  }
);

export const selectHolidays = createSelector(selectOfficeTimeState, (state) => {
  return state.holidays;
});
export const selectHolidayDays = createSelector(selectHolidays, (holidays) => {
  return Object.values(holidays ?? {});
});

export const selectOfficedays = createSelector(
  selectOfficeTimeState,
  (state) => {
    return state.officedays ?? [];
  }
);

export const selectFreedays = createSelector(selectOfficeTimeState, (state) => {
  return state.freedays ?? [];
});
