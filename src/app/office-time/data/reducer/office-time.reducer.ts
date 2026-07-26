import { createReducer, on } from '@ngrx/store';
import { Dayjs } from 'dayjs';
import {
  IOfficeTimeState,
  IOfficeTimeStateStorage,
} from '../../model/office-time.types';
import { OfficeTimeActions } from '../actions/office-time.actions';
import {
  deserializeIsoStringMap,
  deserializeIsoStrings,
  validateFreedays,
} from '../../util/office-time.utils';

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

// The day lists are sets keyed by CALENDAR day, not by timestamp — so marking a
// day that is already marked must leave the state reference untouched.
const hasDay = (days: Dayjs[] | undefined, day: Dayjs): boolean =>
  !!days?.some((existing) => existing.isSame(day, 'day'));

const withDay = (days: Dayjs[] | undefined, day: Dayjs): Dayjs[] => [
  ...(days ?? []),
  day,
];

// Self-heal: append any dashboard item added since this user last persisted
// (e.g. 'wordclock'), preserving their existing order.
const withNewlyAddedDashboardItems = (
  storedItems: IOfficeTimeState['dashboardItems'] | undefined
): IOfficeTimeState['dashboardItems'] => {
  const items = storedItems ?? initialOfficeTime.dashboardItems;
  const missing = initialOfficeTime.dashboardItems.filter(
    (item) => !items.includes(item)
  );
  return [...items, ...missing];
};

// Storage keeps calendar days as ISO strings; the state keeps Dayjs.
const deserializedDayCollections = (stored: IOfficeTimeStateStorage) => ({
  holidays: deserializeIsoStringMap(stored.holidays),
  officedays: deserializeIsoStrings(stored.officedays),
  freedays: deserializeIsoStrings(stored.freedays),
});

export const officeTimeReducer = createReducer(
  initialOfficeTime,
  on(
    OfficeTimeActions.loadHolidaysSuccess,
    (state, { holidays }): IOfficeTimeState => ({
      ...state,
      holidays: { ...holidays },
    })
  ),
  on(OfficeTimeActions.addOfficeTime, (state, { today }): IOfficeTimeState =>
    hasDay(state.officedays, today)
      ? state
      : { ...state, officedays: withDay(state.officedays, today) }
  ),
  on(
    OfficeTimeActions.addOfficeday,
    (state, { officeday }): IOfficeTimeState =>
      hasDay(state.officedays, officeday)
        ? state
        : { ...state, officedays: withDay(state.officedays, officeday) }
  ),
  on(
    OfficeTimeActions.setOfficedays,
    (state, { officedays }): IOfficeTimeState => ({
      ...state,
      officedays: [...officedays],
    })
  ),
  on(
    OfficeTimeActions.saveTargetOfficeDaysPerWeek,
    (state, { daysPerWeek }): IOfficeTimeState => ({
      ...state,
      targetOfficeDaysPerWeek: daysPerWeek,
    })
  ),
  on(OfficeTimeActions.resetData, (state): IOfficeTimeState => ({
    ...initialOfficeTime,
    holidays: state.holidays,
  })),
  on(OfficeTimeActions.addFreeday, (state, { freeday }): IOfficeTimeState =>
    hasDay(state.freedays, freeday)
      ? state
      : { ...state, freedays: withDay(state.freedays, freeday) }
  ),
  on(
    OfficeTimeActions.setFreedays,
    (state, { freedays }): IOfficeTimeState => ({
      ...state,
      freedays: [...validateFreedays(freedays, state.holidays)],
    })
  ),
  on(
    OfficeTimeActions.saveDashboardSettings,
    (state, { key, active }): IOfficeTimeState => ({
      ...state,
      dashboardSettings: { ...state.dashboardSettings, [key]: active },
    })
  ),
  on(OfficeTimeActions.loaded, (state, { officeTime }): IOfficeTimeState => {
    if (!officeTime) return state;
    // Merge over initialOfficeTime so corrupted or partially-migrated storage
    // can't leave required fields undefined.
    return {
      ...initialOfficeTime,
      ...officeTime,
      dashboardSettings: {
        ...initialOfficeTime.dashboardSettings,
        ...officeTime.dashboardSettings,
      },
      dashboardItems: withNewlyAddedDashboardItems(officeTime.dashboardItems),
      ...deserializedDayCollections(officeTime),
    };
  })
);
