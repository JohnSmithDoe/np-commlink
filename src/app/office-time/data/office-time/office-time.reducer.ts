import { createReducer, on } from '@ngrx/store';
import { IOfficeTimeState } from '../../../@shared/types';
import { OfficeTimeActions } from './office-time.actions';
import {
  deserializeIsoStringMap,
  deserializeIsoStrings,
  validateFreedays,
} from './office-time.utils';

export const initialOfficeTime: IOfficeTimeState = {
  targetOfficeDaysPerWeek: 2.5,
  freedays: [],
  holidays: {},
  officedays: [],
  dashboardSettings: {
    showDateCard: true,
    showPercentageCard: true,
    showOfficedaysCardEdit: true,
    showOfficedaysCardList: false,
    showFreedaysCardEdit: true,
    showFreedaysCardList: false,
    showHolidaysCard: true,
    showStatsWeek: true,
    showStatsMonth: true,
    showStatsQuarter: true,
    showStatsYear: true,
    showWordclockCard: true,
  },
  dashboardItems: [
    'date',
    'button',
    'wordclock',
    'officedays-edit',
    'officedays-list',
    'freedays-edit',
    'freedays-list',
    'stats-year',
    'stats-quarter',
    'stats-month',
    'stats-week',
    'holidays',
  ],
};

export const officeTimeReducer = createReducer(
  initialOfficeTime,
  on(
    OfficeTimeActions.loadHolidaysSuccess,
    (_state, { holidays }): IOfficeTimeState => ({
      ..._state,
      holidays: { ...holidays },
    })
  ),
  on(OfficeTimeActions.loadHolidaysFailure, (_state): IOfficeTimeState => ({
    ..._state,
    holidays: {},
  })),
  on(OfficeTimeActions.addOfficeTime, (_state, { today }): IOfficeTimeState => {
    if (_state.officedays?.find((day) => day.isSame(today, 'day')))
      return _state;

    return {
      ..._state,
      officedays: [...(_state.officedays ?? []), today],
    };
  }),
  on(
    OfficeTimeActions.addOfficeday,
    (_state, { officeday }): IOfficeTimeState => {
      if (_state.officedays?.find((day) => day.isSame(officeday, 'day')))
        return _state;

      return {
        ..._state,
        officedays: [...(_state.officedays ?? []), officeday],
      };
    }
  ),
  on(
    OfficeTimeActions.setOfficedays,
    (_state, { officedays }): IOfficeTimeState => {
      return {
        ..._state,
        officedays: [...officedays],
      };
    }
  ),
  on(
    OfficeTimeActions.saveTargetOfficeDaysPerWeek,
    (_state, { daysPerWeek }): IOfficeTimeState => {
      return { ..._state, targetOfficeDaysPerWeek: daysPerWeek };
    }
  ),

  on(OfficeTimeActions.resetData, (_state): IOfficeTimeState => {
    return {
      ...initialOfficeTime,
      holidays: _state.holidays,
      barcode: _state.barcode,
    };
  }),
  on(OfficeTimeActions.addFreeday, (_state, { freeday }): IOfficeTimeState => {
    if (_state.freedays?.find((day) => day.isSame(freeday, 'day')))
      return _state;

    return {
      ..._state,
      freedays: [...(_state.freedays ?? []), freeday],
    };
  }),
  on(
    OfficeTimeActions.setFreedays,
    (_state, { freedays }): IOfficeTimeState => {
      return {
        ..._state,
        freedays: [...validateFreedays(freedays, _state.holidays)],
      };
    }
  ),
  on(
    OfficeTimeActions.saveBarcode,
    (_state, { base64Blob }): IOfficeTimeState => ({
      ..._state,
      barcode: base64Blob,
    })
  ),
  on(
    OfficeTimeActions.rotateBarcodeSuccess,
    (_state, { barcode }): IOfficeTimeState => ({
      ..._state,
      barcode,
    })
  ),
  on(OfficeTimeActions.deleteBarcode, (_state): IOfficeTimeState => ({
    ..._state,
    barcode: undefined,
  })),
  on(
    OfficeTimeActions.saveDashboardSettings,
    (_state, { key, active }): IOfficeTimeState => ({
      ..._state,
      dashboardSettings: {
        ..._state.dashboardSettings,
        [key]: active,
      },
    })
  ),
  on(OfficeTimeActions.loaded, (_state, { officeTime }): IOfficeTimeState => {
    const stored = officeTime;
    if (!stored) return _state;

    // Merge over initialOfficeTime so corrupted or partially-migrated
    // storage doesn't leave required fields (dashboardSettings,
    // dashboardItems, targetOfficeDaysPerWeek) undefined.
    const storedItems =
      stored.dashboardItems ?? initialOfficeTime.dashboardItems;
    // Self-heal: append any dashboard item added since this user last
    // persisted (e.g. 'wordclock'), preserving their existing order.
    const missingItems = initialOfficeTime.dashboardItems.filter(
      (item) => !storedItems.includes(item)
    );
    return {
      ...initialOfficeTime,
      ...stored,
      dashboardSettings: {
        ...initialOfficeTime.dashboardSettings,
        ...(stored.dashboardSettings ?? {}),
      },
      dashboardItems: [...storedItems, ...missingItems],
      holidays: deserializeIsoStringMap(stored.holidays),
      officedays: deserializeIsoStrings(stored.officedays),
      freedays: deserializeIsoStrings(stored.freedays),
    };
  })
);
