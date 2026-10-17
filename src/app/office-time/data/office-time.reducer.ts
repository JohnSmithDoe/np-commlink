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
  holidayMapFrom,
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
  reminder: { enabled: false, hour: 9, minute: 0 },
};

const withKnownDashboardItems = (
  storedItems: OfficeTimeState['dashboardItems'] | undefined
): OfficeTimeState['dashboardItems'] => {
  const known = (storedItems ?? initialOfficeTime.dashboardItems).filter(
    (item) => Object.hasOwn(DASHBOARD_CARD_VISIBILITY, item)
  );
  const missing = initialOfficeTime.dashboardItems.filter(
    (item) => !known.includes(item)
  );
  return [...known, ...missing];
};

const deserializedDayCollections = (stored: OfficeTimeStateStorage) => {
  return {
    holidays: holidayMapFrom(stored.holidays),
    officedays: dayMapFrom(stored.officedays),
    freedays: dayMapFrom(stored.freedays),
  };
};

export const officeTimeReducer = createReducer(
  initialOfficeTime,
  on(
    OfficeTimeActions.loadHolidaysSuccess,
    (state, { holidays }): OfficeTimeState => {
      return {
        ...state,
        holidays: { ...holidays },
      };
    }
  ),
  on(OfficeTimeActions.addOfficeTime, (state, { today }): OfficeTimeState => {
    return {
      ...state,
      officedays: { ...state.officedays, [dayjsToString(today)]: true },
    };
  }),
  on(
    OfficeTimeActions.setOfficedays,
    (state, { officedays }): OfficeTimeState => {
      return {
        ...state,
        officedays: dayMapFrom(officedays),
      };
    }
  ),
  on(
    OfficeTimeActions.saveTargetOfficeDaysPerWeek,
    (state, { daysPerWeek }): OfficeTimeState => {
      return {
        ...state,
        targetOfficeDaysPerWeek: daysPerWeek,
      };
    }
  ),
  on(OfficeTimeActions.resetData, (state): OfficeTimeState => {
    return {
      ...initialOfficeTime,
      holidays: state.holidays,
    };
  }),
  on(OfficeTimeActions.addFreeday, (state, { freeday }): OfficeTimeState => {
    return {
      ...state,
      freedays: { ...state.freedays, [dayjsToString(freeday)]: true },
    };
  }),
  on(OfficeTimeActions.setFreedays, (state, { freedays }): OfficeTimeState => {
    return {
      ...state,
      freedays: withoutHolidays(dayMapFrom(freedays), state.holidays),
    };
  }),
  on(
    OfficeTimeActions.saveDashboardSettings,
    (state, { key, active }): OfficeTimeState => {
      return {
        ...state,
        dashboardSettings: { ...state.dashboardSettings, [key]: active },
      };
    }
  ),
  on(OfficeTimeActions.setReminder, (state, { reminder }): OfficeTimeState => {
    return {
      ...state,
      reminder,
    };
  }),
  on(OfficeTimeActions.loaded, (state, { officeTime }): OfficeTimeState => {
    if (!officeTime) return state;
    return {
      ...initialOfficeTime,
      ...officeTime,
      dashboardSettings: {
        ...initialOfficeTime.dashboardSettings,
        ...officeTime.dashboardSettings,
      },
      reminder: { ...initialOfficeTime.reminder, ...officeTime.reminder },
      dashboardItems: withKnownDashboardItems(officeTime.dashboardItems),
      ...deserializedDayCollections(officeTime),
    };
  })
);
