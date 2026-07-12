import { createFeatureSelector, createSelector } from '@ngrx/store';
import { IOfficeTimeState } from '../../../@shared/types';

export const selectOfficeTimeState =
  createFeatureSelector<IOfficeTimeState>('officeTime');

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

export const selectBarcodeDataUrl = createSelector(
  selectOfficeTimeState,
  (state) => {
    return state.barcode;
  }
);
