import { createReducer, on } from '@ngrx/store';
import { Dayjs } from 'dayjs';
import {
  DASHBOARD_CARD_VISIBILITY,
  OfficeTimeState,
  OfficeTimeStateStorage,
} from '../model/office-time.types';
import { OfficeTimeActions } from './office-time.actions';
import {
  deserializeIsoStringMap,
  deserializeIsoStrings,
  validateFreedays,
} from '../util/office-time.utils';

export const initialOfficeTime: OfficeTimeState = {
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

const hasDay = (days: Dayjs[] | undefined, day: Dayjs): boolean =>
  !!days?.some((existing) => existing.isSame(day, 'day'));

const withDay = (days: Dayjs[] | undefined, day: Dayjs): Dayjs[] => [
  ...(days ?? []),
  day,
];

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
  officedays: deserializeIsoStrings(stored.officedays),
  freedays: deserializeIsoStrings(stored.freedays),
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
  on(OfficeTimeActions.addOfficeTime, (state, { today }): OfficeTimeState =>
    hasDay(state.officedays, today)
      ? state
      : { ...state, officedays: withDay(state.officedays, today) }
  ),
  on(
    OfficeTimeActions.setOfficedays,
    (state, { officedays }): OfficeTimeState => ({
      ...state,
      officedays: [...officedays],
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
  on(OfficeTimeActions.addFreeday, (state, { freeday }): OfficeTimeState =>
    hasDay(state.freedays, freeday)
      ? state
      : { ...state, freedays: withDay(state.freedays, freeday) }
  ),
  on(OfficeTimeActions.setFreedays, (state, { freedays }): OfficeTimeState => ({
    ...state,
    freedays: [...validateFreedays(freedays, state.holidays)],
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
