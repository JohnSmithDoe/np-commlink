import { createReducer, on } from '@ngrx/store';
import {
  DASHBOARD_CARD_VISIBILITY,
  OfficeTimeState,
  OfficeTimeStateStorage,
} from '../model/office-time.types';
import { OfficeTimeActions } from './office-time.actions';
import {
  dayjsToString,
  dayMapFrom,
  deserializeIsoStringMap,
  withoutHolidays,
} from '../util/office-time.utils';

export const initialOfficeTime: OfficeTimeState = {
  targetOfficeDaysPerWeek: 2.5,
  freedays: {},
  holidays: {},
  officedays: {},
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

const withKnownDashboardItems = (
  storedItems: OfficeTimeState['dashboardItems'] | undefined
): OfficeTimeState['dashboardItems'] => {
  const known = (storedItems ?? initialOfficeTime.dashboardItems).filter(
    (item) => item in DASHBOARD_CARD_VISIBILITY
  );
  const missing = initialOfficeTime.dashboardItems.filter(
    (item) => !known.includes(item)
  );
  return [...known, ...missing];
};

const deserializedDayCollections = (stored: OfficeTimeStateStorage) => ({
  holidays: deserializeIsoStringMap(stored.holidays),
  officedays: dayMapFrom(stored.officedays),
  freedays: dayMapFrom(stored.freedays),
});

export const officeTimeReducer = createReducer(
  initialOfficeTime,
  on(
    OfficeTimeActions.loadHolidaysSuccess,
    (state, { holidays }): OfficeTimeState => ({
      ...state,
      holidays: { ...holidays },
    })
  ),
  on(OfficeTimeActions.addOfficeTime, (state, { today }): OfficeTimeState => ({
    ...state,
    officedays: { ...state.officedays, [dayjsToString(today)]: true },
  })),
  on(
    OfficeTimeActions.setOfficedays,
    (state, { officedays }): OfficeTimeState => ({
      ...state,
      officedays: dayMapFrom(officedays),
    })
  ),
  on(
    OfficeTimeActions.saveTargetOfficeDaysPerWeek,
    (state, { daysPerWeek }): OfficeTimeState => ({
      ...state,
      targetOfficeDaysPerWeek: daysPerWeek,
    })
  ),
  on(OfficeTimeActions.resetData, (state): OfficeTimeState => ({
    ...initialOfficeTime,
    holidays: state.holidays,
  })),
  on(OfficeTimeActions.addFreeday, (state, { freeday }): OfficeTimeState => ({
    ...state,
    freedays: { ...state.freedays, [dayjsToString(freeday)]: true },
  })),
  on(OfficeTimeActions.setFreedays, (state, { freedays }): OfficeTimeState => ({
    ...state,
    freedays: withoutHolidays(dayMapFrom(freedays), state.holidays),
  })),
  on(
    OfficeTimeActions.saveDashboardSettings,
    (state, { key, active }): OfficeTimeState => ({
      ...state,
      dashboardSettings: { ...state.dashboardSettings, [key]: active },
    })
  ),
  on(OfficeTimeActions.loaded, (state, { officeTime }): OfficeTimeState => {
    if (!officeTime) return state;
    return {
      ...initialOfficeTime,
      ...officeTime,
      dashboardSettings: {
        ...initialOfficeTime.dashboardSettings,
        ...officeTime.dashboardSettings,
      },
      dashboardItems: withKnownDashboardItems(officeTime.dashboardItems),
      ...deserializedDayCollections(officeTime),
    };
  })
);
